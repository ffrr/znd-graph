define("znd-graph-timeline", ["znd-graph-support", "lodash", "d3", "jquery",
    "util", "znd-graph-constants", "znd-graph-colors", "znd-graph-layout", "znd-graph-locale"
  ],

  function(support, _, d3, $, util, constants, colors, layout, locale) {
    "use strict";

    var tooltipRenderer = support.tooltips,
      gridRenderer = support.grid,
      pos = support.positionalUtils,
      paddedTimeScale = support.paddedTimeScale,
      window_ = support.window_,
      timeAxis = support.timeAxis,
      color = colors.getColor;


    var inner = function(base) {
      return base.append("g");
    };

    var timeline = function(config, data) {

      var start, end, columnWidth, innerHeight, outerWidth, computedHeight, dataWindow, positionalSeries,
        rangedSeries, headerSeries, navig, innerY, currentPan, segmentAmount, compensationRatio, legendItemHeight,
        itemHeight, yearlyTotals, configChanged;

      var titleHeight = 18,
        titleToTimelinePadding = 50,
        linePadding = {
          left: 10,
          right: 10
        },
        axisTextPadding = {
          left: 10,
          top: 15
        },
        numberFormat = support.numberFormat();

      //init defaults

      var id = util.randomId();

      var timeScale = d3.time.scale(),
        companyScale = d3.scale.ordinal(),
        positionScale = d3.scale.ordinal();

      var rangeKey = function(item) {
          return item.series + item.position;
        },
        verticalPosition = function(d) {
          var ret = innerY + d.totalIndex * itemHeight + d.seriesIndex * legendItemHeight + 15;
          return ret;
        },
        headerPosition = function(d) {
          var itemSum = _.reduce(_.range(0, d.seriesIndex), function(total, index) {
            return total + data.timeline[index].length;
          }, 0);
          return innerY + (itemSum * itemHeight) + d.seriesIndex * legendItemHeight - legendItemHeight + 10;
        },
        linePosition = function(d) {
          return -$(this).siblings("g.headers-text").find("text").height();
        };

      var canvas = config.container.append("svg").attr("class", "canvas-timeline"),
        clip = canvas.append("clipPath").attr("id", "clip-" + id).append("rect"),
        content = inner(canvas),
        barClip = content.append("clipPath").attr("id", "clip-bar-" + id),
        grid = inner(content),
        timeline = inner(content).attr("class", "inner-timeline"),
        legend = inner(canvas),

        leftAxis = legend.append("g").attr("class", "labelgroup-left"),
        rightAxis = legend.append("g").attr("class", "labelgroup-right"),

        title = legend.append("text").attr("class", "heading")
        .attr("text-anchor", "middle")
        .text(locale("timeline.title")),

        bottomAxis = timeAxis(timeline, false, numberFormat),

        pointer = legend.append("circle")
        .attr({
          "r": 4,
          "fill": "transparent",
          "stroke": "#FFF",
          "stroke-width": 2
        })
        .style("visibility", "hidden");

      //canvas.attr("clip-path", "url(#clip-" + id + ")");

      var applyLayout = function() {

          if (layout.isMobile()) {
            segmentAmount = 1;
            compensationRatio = 0;
            legendItemHeight = config.legendItemHeight;
            itemHeight = config.itemHeight * 0.9;
          }

          if (layout.isDesktop()) {
            segmentAmount = config.segments;
            compensationRatio = 0.5;
            legendItemHeight = 0;
            itemHeight = config.itemHeight;
          }
        },

        initDefaults = function() {

          _.defaults(config, {
            padding: {},
            margin: {},
            itemHeight: 50,
            segments: 7,
            tipCompensation: 4,
            labelPadding: 15,
            legendItemHeight: 50
          });

          _.defaults(config.padding, {
            top: 30,
            bottom: 0
          });

          _.defaults(config.margin, {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
          });
        },

        onPan = function(position) {
          legend.selectAll("tspan.percentage").text(function(d) {
            return Math.round((data.y[position][d.seriesIndex] / yearlyTotals[position]) * 100) + " %";
          });

          legend.selectAll("tspan.sum").text(numberFormat.positionRelativeSumRendererFactory(position));
        },

        pan = function(position) {
          var compensation = position > 0 ? columnWidth * compensationRatio : 0;
          pos.pan(content, config.margin, -(position * columnWidth + compensation));
          currentPan = position;
          onPan(position);
        },

        left = function() {
          pan(navig.back());
        },

        right = function() {
          pan(navig.forward());
        },

        renderTitle = function() {
          layout.hideOnMobile(title);
        },

        formatDate = function(date) {
          return date instanceof Date ? util.formatDate(date) : "súčasnosť";
        },

        formatDateRange = function(range) {
          return formatDate(range[0]) + ' - ' + formatDate(range[1]);
        },

        formatDateRanges = function(ranges) {
          return _.map(ranges, formatDateRange).join(', ');
        },

        renderTooltipTemplate = function(model) {

          var company = "<em class=\"company\"><%= company %></em>",
            position = "<span class=\"position\"><%= position %></span>",
            ranges = "<span class=\"ranges\"><%= formatDateRanges(ranges) %></span>",
            tpl = _.template(["<div class=\"tooltip-timeline\">", company, position, ranges, "</div>"].join(""));

          return tpl(model);
        },

        getTooltipModel = function(segment) {
          return {
            company: segment.series,
            position: segment.position,
            ranges: segment.ranges,
            formatDateRanges: formatDateRanges
          };
        },

        denormalizeSeries = function() {
          var total = 0;

          positionalSeries = _.flatten(data.timeline.map(function(item, seriesIndex) {
            return item.map(function(segment, index) {
              var ret = _.assign(segment, {
                  series: data.series[seriesIndex]
                }),
                model = getTooltipModel(ret);
              return _.assign(ret, {
                tooltipDescription: renderTooltipTemplate(model),
                seriesIndex: seriesIndex,
                index: index,
                seriesLength: item.length,
                totalIndex: total++,
                tooltipModel: model
              });
            });
          }));

          //denormalize series by range
          rangedSeries = _.flatten(positionalSeries.map(function(item) {
            // inject data to range object
            return item.ranges.map(function(range) {
              return _.extend(_.pick(item, ['seriesIndex', 'seriesLength', 'index', 'series', 'totalIndex']), {
                from: range[0],
                to: range[1]
              });
            });
          }));

          total = util.totals(data);

          yearlyTotals = _.map(data.y, function(series) {
            return _.reduce(series, util.sum);
          });

          headerSeries = _.map(data.series, function(series, index) {
            return {
              series: series,
              seriesIndex: index
            };
          });
        },

        computeHeight = function() {
          var p = config.padding;
          innerHeight = (positionalSeries.length - 1) * itemHeight + (headerSeries.length - 1) * legendItemHeight;
          innerY = config.padding.top + (layout.isMobile() ? 0 : (titleHeight + titleToTimelinePadding)) + legendItemHeight;
          config.height = innerY + innerHeight + p.bottom + bottomAxis.height();
        },

        renderXAxis = function() {
          layout.hideOnMobile(bottomAxis.container);

          if (layout.isDesktop()) {
            bottomAxis.reset(data, timeScale, {
              x: columnWidth / 2,
              y: config.height - bottomAxis.height()
            }, null);
          }
        },

        renderLegendAxis = function(base, textRenderer) {
          base.selectAll(".label").remove();

          var boundBase = base.selectAll(".label").data(positionalSeries);

          //boundBase.exit().remove();
          boundBase.enter().append("text").text(textRenderer);

          boundBase.attr({
            "x": 0,
            "y": verticalPosition,
            "class": "label"
          });
        },

        renderLegendHeaders = function() {
          legend.selectAll(".legend-headers").remove();

          if (layout.isMobile()) {
            var headers = legend.selectAll(".legend-headers")
              .data(headerSeries).enter().append("g");

            headers
              .attr("class", "legend-headers")
              .attr("transform", function(d) {
                return "translate(0, " + headerPosition(d) + ")";
              });

            var texts = headers.append("g").attr("class", "headers-text"),

              left = texts.append("text")
              .style("font-weight", "bold")
              .attr("x", axisTextPadding.left)
              .attr("fill", function(d) {
                return color(d.series);
              })
              .text(function(d) {
                return d.series;
              });

            right = texts.append("text")
              .style({
                "text-anchor": "end"
              })
              .attr({
                "x": config.width - axisTextPadding.left,
                "class": "percentage"
              });

            right.append("tspan").attr("class", "percentage")
              .style("font-weight", "bold")
              .style("padding-right", "100")
              .attr("fill", function(d) {
                return color(d.series);
              });

            right.append("tspan").attr("class", "sum")
              .attr("dx", 5)
              .attr("fill", "white");

            texts.attr("transform", "translate(0, 10)");

            headers
              .append("line")
              .attr({
                "x1": 0,
                "y1": linePosition,
                "x2": config.width,
                "y2": linePosition
              });
          }
        },

        renderYAxes = function() {
          var positionRenderer = function(d) {
              return d.position;
            },
            dateRangeRenderer = function(d) {
              return formatDateRanges(d.ranges);
            };

          leftAxis.attr("transform", "translate(" + axisTextPadding.left + ",-" + config.labelPadding + ")");
          rightAxis.attr("transform", "translate(" + (config.width - axisTextPadding.left) + ",-" + config.labelPadding + ")");

          renderLegendAxis(leftAxis, positionRenderer);
          renderLegendAxis(rightAxis, layout.isMobile() ? dateRangeRenderer : positionRenderer);

          renderLegendHeaders();
        },

        renderBackgroundBars = function(container) {
          renderBars(container, "bar-bg");
        },

        renderClippingBars = function() {
          var bars = barClip.selectAll(".bar-clipper").data(positionalSeries);

          bars.exit().remove();
          //content.attr("clip-path", "");

          //if(layout.isDesktop()) return;

          bars.enter().append("rect");

          bars.transition().attr({
            "x": linePadding.left,
            "width": config.width - linePadding.right,
            "y": function(d) { return verticalPosition(d) - 5; },
            "height": 10,
            "class": "bar-clipper"
          });

          //content.attr("clip-path", "url(#clip-bar-" + id + ")");

          return bars;
        },

        renderBars = function(container, className) {
          var bars = container.selectAll("." + className).data(positionalSeries);

          bars.exit().remove();

          bars.enter().append("line");
          //.attr("class", "bar-bg-cont")
          //.attr("transform", function(d) { return "translate(0, " + verticalPosition(d) + ")" });

          //added.append("line");

          bars.transition().attr({
            "x1": config.tipCompensation + linePadding.left,
            "x2": columnWidth * data.x.length - config.tipCompensation - linePadding.right,
            "y1": verticalPosition,
            "y2": verticalPosition,
            "class": className
          });

          return bars;
        },



        renderOverlays = function(container) {
          var overlays = container.selectAll(".bar-overlay").data(positionalSeries);

          overlays.exit().remove();
          overlays.enter().append("rect");

          overlays.attr("height", config.itemHeight + 4)
            .attr("width", columnWidth * data.x.length)
            .attr("y", function(d) {
              return verticalPosition(d) - config.itemHeight / 2;
            })
            .attr("class", "bar-overlay")
            .attr("fill", "transparent");
        },

        renderTimeline = function() {

          renderBackgroundBars(timeline);

          var front = timeline.selectAll(".bar").data(rangedSeries);

          front.exit().remove();

          front.enter().append("line");

          front.transition().attr({
            "x1": function(d) {
              return timeScale(d.from) + config.tipCompensation + linePadding.left;
            },
            "x2": function(d) {
              var sanitizedEnd = d.to instanceof Date ? d.to : util.yearEnd(end.getFullYear()); //todo: move to sanitizer
              return timeScale(sanitizedEnd) - config.tipCompensation - linePadding.right;
            },
            "y1": verticalPosition,
            "y2": verticalPosition,
            "class": "bar"
          }).style("stroke", function(d) {
            return color(d.series);
          });

          renderOverlays(timeline);
        },

        attachTooltip = function() {
          var containerEl = $(config.container.node()),
            tooltipEl = containerEl.children(".d3-tip").first(),

            moveHandler = function() {
              var currentShift = pointer.node().getCTM().e,
                currentDatum = d3.select(d3.event.srcElement || d3.event.target).datum(),
                x = d3.event.x || d3.event.clientX,
                leftPos = x - tooltipEl.width() / 2 - 6;

              pointer.attr({
                "cx": x - currentShift,
                "cy": verticalPosition(currentDatum)
              });

              tooltipEl.css({
                left: leftPos,
                top: verticalPosition(currentDatum) + containerEl.position().top - (tooltipEl.height() + 45)
              });

              tooltipEl.html(currentDatum.tooltipDescription);
            },

            overHandler = function() {

              var target = d3.select(d3.event.srcElement || d3.event.target);

              if (target && target.datum()) {
                tooltipEl.show();
                pointer.style("visibility", "visible");
              }
            },

            outHandler = function() {
              var overTooltip = _.includes(tooltipEl.find("*").get(), d3.event.toElement);
              if (!overTooltip) { //add parent detection
                tooltipEl.hide();
                pointer.style("visibility", "hidden");
              }
            },

            toggle = function(handler) {
              return layout.isMobile() ? null : handler;
            };

          layout.hideOnMobile(util.toD3Node(tooltipEl));

          timeline.selectAll(".bar-overlay").on("mousemove", toggle(moveHandler));
          canvas.on("mouseover", toggle(overHandler));
          canvas.on("mouseout", toggle(outHandler));

        },


        renderGrid = function() {

          layout.hideOnMobile(grid);

          if (layout.isDesktop()) {
            gridRenderer(grid)
              .vert(paddedTimeScale(columnWidth * data.x.length, data))
              .reset({
                width: columnWidth * data.x.length,
                height: config.height
              });
          }
        },

        repositionTitle = function() {
          title.transition().attr("x", config.width / 2).attr("y", config.padding.top);
        },

        sizing = function() {

          var margin = config.margin,
            shifted = pos.extendedMargin(margin, columnWidth);
          pos.resize(canvas, config, margin);
          pos.innerClip(clip, config, margin);

          pos.remargin(grid, margin);
          pos.remargin(timeline, margin);
          pos.remargin(legend, margin);

          repositionTitle();

        },

        toggle = function(toggle) {
          //canvas.attr("visibility", toggle ? "visible":"hidden");
          canvas.style("display", toggle ? "block" : "none");
        },

        initialize = function() {
          columnWidth = config.width / (segmentAmount - compensationRatio);
          start = _.first(data.x);
          end = _.last(data.x);
          outerWidth = columnWidth * (data.x.length - 1);

          navig = config.navig;

          denormalizeSeries();
          computeHeight();

          timeScale
            .domain([start, end])
            .range([0, outerWidth]);

          companyScale
            .domain(data.series)
            .rangePoints([innerY, innerHeight + innerY]);

          //renderClippingBars();
          renderTimeline();
          renderGrid();
          renderXAxis();
          renderYAxes();
          renderTitle();

          sizing();

          attachTooltip();
        },

        reset = function( /* newData, newConfig */ ) {
          data = arguments[0] || data;
          config = arguments[1] || config;

          numberFormat.reset(data);

          initDefaults();
          applyLayout();
          //dataWindow = window_(data, [0, segmentAmount]);
          initialize();
        };

      return {
        reset: reset,
        pan: pan,
        type: constants.timeline,
        toggle: toggle
      };
    };

    return timeline;
  });

define("znd-graph-bar", ["znd-graph-support", "lodash", "d3", "jquery",
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

    var barGraph = function(config, data) {
      //variables

      var me = {},
        dir,
        columnWidth, margin, dataWindow, barWidth, extendedMargin, start, end, max, innerWidth, outerWidth, innerHeight,
        stackedData, export_, navig, incSegments, currentPan;

      var id = util.randomId();

      //constants
      var xAxisPadding = 100,
        yTicks = 4,
        axisTextPadding = {
          left: 10,
          top: 15
        },
        numberFormat = support.numberFormat(),
        minBarHeight = 0;

      var clampItemToMinimumHeight = function(number) {
          var onePixelEquivalent = max / innerHeight;
          return number < onePixelEquivalent ? minBarHeight * onePixelEquivalent : number;
        },

        stackedBarData = function(data) {
          return function(item, i) {
            var y0 = 0,
              obj = {};
            obj.x = data.x[i];
            obj.y = _.map( /* color.domain() */ data.series, function(series, j) {
              return {
                series: series,
                amount: item[j],
                y0: y0,
                y1: y0 += clampItemToMinimumHeight(item[j])
              };
            });

            return obj;
          };
        };


      //scales and data elements
      var timeScale = d3.time.scale(),
        amountScale = d3.scale.linear(),
        amountAxis = d3.svg.axis()
        .orient("right")
        .ticks(yTicks)
        .tickFormat(numberFormat.amountRendererForAxis),
        // area = d3.svg.area()
        //     .x(function(d) { return timeScale(d.x); })
        //     .y0(function(d) { return amountScale(d.y0); })
        //     .y1(function(d) { return amountScale(d.y0 + d.y); }),
        // flatArea = d3.svg.area()
        //     .x(function(d) { return timeScale(d.x); })
        //     .y0(function() { return amountScale(0); })
        //     .y1(function() { return amountScale(0); }),
        stack = d3.layout.stack()
        .values(function(d) {
          return d.values;
        });

      var tooltipTemplate = _.template($("#tpl-tooltip").html());

      //elements
      var canvas = config.container.append("svg").attr("class", "canvas-area"),
        clip = canvas.append("clipPath").attr("id", "clip-" + id).append("rect"),
        content = canvas.append("g"),
        grid = inner(content),
        graph = inner(content),
        legend = inner(canvas),

        title = legend.append("text").attr("class", "heading")
        .attr("text-anchor", "middle")
        .text(locale("bar.title")),

        leftAxis = legend.append("g").attr("class", "axis-y axis-left"),
        rightAxis = legend.append("g").attr("class", "axis-y axis-right"),
        bottomAxis = timeAxis(graph, true, numberFormat),

        tooltips = tooltipRenderer(graph, function(d, element) {
          var model = _.map(d.y, function(item) {
            return {
              color: color(item.series),
              company: item.series,
              amount: numberFormat.amountRendererForTooltip(item.amount)
            };
          });
          return tooltipTemplate({
            model: model
          });
        }, function(d) {
          if (d.x === start) {
            return "e";
          }
          return "w";
        }, function(d) {
          var yOffset = amountScale(d.y[data.series.length - 1].y1) - innerHeight / 2;
          if (d.x === start) {
            return [yOffset, 10];
          }
          return [yOffset, -10];
        });

      canvas.attr("clip-path", "url(#clip-" + id + ")");

      var initDefaults = function() {
          _.defaults(config, {
            padding: {},
            margin: {},
            segments: 7
          });

          _.defaults(config.padding, {
            top: 0,
            bottom: 0
          });

          _.defaults(config.margin, {
            left: 0,
            top: 20,
            bottom: 0,
            right: 0
          });
        },

        pan = function(position) {
          var compensation = position > 0 ? columnWidth * 0.5 : 0;
          pos.pan(content, extendedMargin, -(position * columnWidth + compensation));
          currentPan = position;
        },

        renderGrid = function() {
          gridRenderer(grid)
            .horz(amountScale)
            .vert(paddedTimeScale(columnWidth * data.x.length, data))
            .reset({
              width: columnWidth * data.x.length,
              height: config.height + xAxisPadding,
              tickAmount: yTicks
            });
        },

        // renderArea = function() {
        //  var series = graph.selectAll(".series")
        //          .data(stackedData);

        //     series.enter()
        //      .append("path").attr("class", "series")
        //      .attr("d", function(d) { return flatArea(d.values); })
        //      .style("fill", function(d) { return color(d.series); })
        //      .style("opacity", 0);

        //     series.transition().style("opacity", 1).attr("d", function(d) { return area(d.values); })

        //     series.exit().transition().style("opacity", 0).remove();
        // },

        renderBars = function() {

          var bars = graph.selectAll(".segment").data(stackedData),
            overlays = graph.selectAll(".segment-overlay");

          overlays.remove();
          bars.exit().remove();
          bars.enter().append("g").attr("class", "segment");

          bars.transition().attr("transform", function(d) {
            return "translate(" + (timeScale(d.x)) + ",0)";
          });

          var bands = bars.selectAll("rect.band").data(function(d) {
            return d.y;
          });

          bands.exit().remove();

          bands.enter().append("rect").attr("class", "band").style("opacity", 0);

          bands.transition()
            .style("fill", function(d) {
              return color(d.series);
            })
            .style("opacity", 1)
            .attr({
              "x": -barWidth / 2,
              "y": function(d) {
                return amountScale(d.y1);
              },
              "width": barWidth,
              "height": function(d) {
                return amountScale(d.y0) - amountScale(d.y1);
              }
            });

          bars.append("rect")
            .attr({
              "x": -barWidth / 2,
              "class": "segment-overlay",
              "width": barWidth,
              "height": innerHeight,
              "opacity": 0
            });

        },

        renderPointsForGroup = function(d) {
          var group = d3.select(this),
            points = group.selectAll("circle.point").data(function(d) {
              return d.values;
            });

          points.exit().remove();

          points.enter().append("circle")
            //enrich the current datum on iteration
            .datum(function(pointDatum) {
              pointDatum.series = d.series;
              return pointDatum;
            })
            .attr("class", "point")
            .attr("cx", function(d) {
              return timeScale(d.x);
            })
            .attr("cy", function(d) {
              return amountScale(d.y0 + d.y);
            })
            .attr("r", 3)
            .style("opacity", 0)
            .attr("fill", color(group.data()[0].series));
        },

        renderYAxes = function() {
          amountAxis.scale(amountScale);

          rightAxis
            .call(amountAxis)
            .attr("transform", "translate(" + (innerWidth + columnWidth / 2 - config.margin.right) + ",0)")
            .selectAll("text")
            .attr("x", -axisTextPadding.left)
            .attr("y", axisTextPadding.top)
            .style("text-anchor", "end");


          leftAxis
            .call(amountAxis)
            .attr("transform", "translate(0,0)")
            //.style("opacity", 0)
            .selectAll("text")
            .attr("x", -columnWidth / 2 + axisTextPadding.left)
            .attr("y", axisTextPadding.top)
            .style("text-anchor", "start");

        },

        renderXAxis = function() {
          bottomAxis.reset(data, timeScale, {
            x: 0,
            y: innerHeight
          });
        },

        repositionTitle = function() {
          title.transition().attr("x", innerWidth / 2).attr("y", 40);
        },

        sizing = function() {
          pos.resize(canvas, config, margin);
          pos.innerClip(clip, config, margin);

          pos.remargin(grid, margin);
          pos.remargin(graph, extendedMargin);
          pos.remargin(legend, extendedMargin);

          repositionTitle();
        },

        repositionTooltips = function() {
          tooltips.reset(graph.selectAll(".segment-overlay"));
        },

        initialize = function() {
          var columnWidthRatio = data.x.length > config.segments ? config.segments - 0.5:data.x.length;
          columnWidth = config.width / columnWidthRatio;
          barWidth = columnWidth / 4;
          innerWidth = config.width - columnWidth;
          outerWidth = columnWidth * Math.max(data.x.length - 1, 1);
          innerHeight = config.height - (xAxisPadding);

          navig = config.navig;

          start = _.first(data.x);
          end = _.last(data.x);

          max = _.max(_.map(data.y, function(item) {
            return _.reduce(item, util.sum);
          })) * 1.6;

          timeScale.domain([start, end]).range([0, outerWidth]);
          amountScale.domain([0, max]).range([innerHeight, 0]).clamp(true);

          margin = config.margin;
          extendedMargin = pos.extendedMargin(margin, columnWidth);

          sizing();

          stackedData = _.map(data.y, stackedBarData(data));

          renderGrid();
          renderBars();

          renderYAxes();
          renderXAxis();

        },

        reset = function( /* newData, newConfig */ ) {

          config = arguments[1] || config;
          data = arguments[0] || data;

          numberFormat.reset(data);

          if (layout.isMobile()) {
            $(canvas.node()).hide(); // should stop here, but fails
            //return;
          }

          if (layout.isDesktop()) {
            $(canvas.node()).show();
          }

          initDefaults();
          initialize();
          repositionTooltips();
        },

        left = function() {
          pan(navig.back());
        },

        right = function() {
          pan(navig.forward());
        },

        renderPointGroups = function() {
          var pointGroups = graph.selectAll(".points")
            .data(stackedData);

          pointGroups.exit().remove();

          pointGroups.enter().append("g").attr("class", "points")
            .each(renderPointsForGroup);
        };

      export_ = {
        reset: reset,
        pan: pan,
        type: constants.bar
      };

      return export_;
    };

    return barGraph;
});

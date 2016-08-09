define("znd-graph-pie", ["znd-graph-support", "lodash", "d3", "jquery",
    "util", "znd-graph-constants", "znd-graph-colors", "znd-graph-layout"
  ],

  function(support, _, d3, $, util, constants, colors, layout) {
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

    var pieGraph = function(config, data) {

      var aggregate, total, barData, computedHeight, numberFormat = support.numberFormat();


      var xScale = d3.scale.linear(),
        canvas = config.container.append("svg").attr("class", "canvas-piegraph"),
        pieGraph = inner(canvas),
        grid = inner(canvas),
        amountAxis = d3.svg.axis().orient("bottom").tickFormat(numberFormat.amountRendererForAxis),
        bottomAxis = pieGraph.append("g").attr("class", "axis-x");



      var initDefaults = function() {

          _.defaults(config, {
            barHeight: 30,
            bottomAxisHeight: 20,
            padding: {},
            margin: {}
          });

          computedHeight = config.barHeight + config.bottomAxisHeight;

          _.defaults(config.padding, {
            left: 20,
            right: 20
          });

          _.defaults(config.margin, {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
          });
        },

        renderPieGraph = function() {
          var bars = pieGraph.selectAll(".segment").data(barData);

          bars.exit().transition().style("opacity", 0).remove();

          bars.enter()
            .append("rect").attr("class", "segment");

          bars.attr("height", config.barHeight)
            .attr("y", 0)
            .attr("fill", function(d) {
              return color(d.series);
            });

          bars.transition().attr("x", function(d, index) {
              return xScale(d.runningTotal - d.sum);
            })
            .attr("width", function(d) {
              return xScale(d.sum);
            });
        },

        renderGrid = function() {
          gridRenderer(grid)
            .vert(xScale, xScale.ticks(10))
            .reset({
              width: config.width,
              height: config.barHeight
            });
        },

        renderXAxis = function() {
          bottomAxis
            .call(amountAxis)
            .attr("transform", "translate(0, " + config.barHeight + ")")
            .selectAll("text")
            .attr("y", 10)
            .style("text-anchor", function(d) {
              return d === 0 ? "start" : "end";
            });
        },

        sizing = function() {
          var margin = config.margin, padding = config.padding;

          pos.resize(canvas, _.assign(config, {
            height: computedHeight
          }), margin, padding);

          pos.remargin(grid, margin, padding);
          pos.remargin(pieGraph, margin, padding);
        },

        initialize = function() {
          aggregate = util.aggregates(data);
          total = util.totals(data);

          // aggregate = _.zip.apply(null, data.y).map(function(arr) { //get the aggregated sum of each series
          //     return _.reduce(arr, util.sum);
          // });

          // total = _.reduce(aggregate, util.sum);

          barData = aggregate.map(function(item, index) {
            return {
              sum: item,
              series: data.series[index]
            };
          });

          barData.map(function(item, index) {
            return _.assign(item, {
              runningTotal: index > 0 ? (item.sum + barData[index - 1].runningTotal) : item.sum,
            });
          });

          //TODO: fix computedSize interface
          xScale.domain([0, total]).range([0, pos.getComputedSize(config, config.margin, config.padding).width]);

          amountAxis.scale(xScale).tickValues([0, total]);

          renderPieGraph();
          renderGrid();
          renderXAxis();

          sizing();
        },

        reset = function( /* newData, newConfig */ ) {
          data = arguments[0] || data;
          config = arguments[1] || config;

          numberFormat.reset(data);

          initDefaults();
          initialize();
        };

      return {
        reset: reset,
        type: constants.pie
      };
    };

  return pieGraph;
});

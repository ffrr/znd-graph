"use strict";

define("test", ["znd-graph-core", "znd-graph-navigation", "znd-graph-controls", "znd-graph-filtering", "znd-graph-config", "znd-graph-layout", "znd-graph-colors", "znd-testdata",  "lodash", "util"], function(app, navig, controls, filter, globalConfig, layout, colors, testdata, _, util) {
    

    var containerSelector = "#graph", 
        data = testdata, 
        segments = 5, 
        initialWidth = $(containerSelector).width() - 15;

    var navigationState = navig.state(data.x.length, segments, 1);
    
    var chartConfigs = {
    
        pie: {
            barHeight: 30,
            amountTickSuffix: "mil. EUR",
            container: d3.select(containerSelector + " .bar")
        },

        bar: {
            height: 400,
            container: d3.select(containerSelector + " .area"),
            max: _.max(_.map(data.y, function(item) { return _.reduce(item, util.sum)})) * 1.6
        }, 

        timeline: {
            itemHeight: 40,
            container: d3.select(containerSelector + " .timeline")
        }
    };

    var navConfig = {
        container: d3.select(containerSelector),
        left: d3.select(containerSelector + " .pan.left"),
        right: d3.select(containerSelector + " .pan.right")
    };
    
    colors.init(data.series);

    var chartDefinitions = _.indexBy(_.map(app, function(chart, chartName) {

        var config = chartConfigs[chartName];

        _.assign(config, { 
            width: initialWidth,
            segments: segments,
            navig: navigationState
        });

        chart = chart(config, data);
        chart.reset();

        return { chart: chart, config: config, name: chartName };
    }), 'name'),

    charts = _.pluck(_.values(chartDefinitions), 'chart');

    // var hbc = app.horizontalBarChart(barChartConfig, data);
    // hbc.reset();

    // var gr = app.barGraph(areaConfig, data/*window_(points, [0,4])*/);
    // gr.reset();
    
    // var tm = app.timeline(timelineConfig, data);
    // tm.reset();

    var ctrl = controls({ container: d3.select("#pie") });

    filter(data, ctrl, charts, true);

    navig.widget(navConfig, navigationState, 
        _.some(charts, function(chart) { return _.contains(["timeline", "bar"], chart.name)} )
    );

    layout.enable($(containerSelector), pairs);

    // $(window).resize(util.onResizeEnd(function() {
    //     barChartConfig.width = areaConfig.width = timelineConfig.width = $(containerSelector).width(),
    //     gr.reset(points3, areaConfig);
    //     tm.reset(points3, timelineConfig);
    //     hbc.reset(points3, barChartConfig);
    // }));
});
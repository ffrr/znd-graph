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
        container: $(".navigable")
    };
    
    colors.init(data.series);

    var componentDefinitions = _.indexBy(_.map(app, function(chart, chartName) {

        var config = chartConfigs[chartName];

        _.assign(config, { 
            width: initialWidth,
            segments: segments,
            navig: navigationState
        });

        chart = chart(config, data);
        chart.reset();

        return { component: chart, config: config, name: chartName };
    }), 'name'),

    charts = _.pluck(_.values(componentDefinitions), 'component');

    var ctrl = controls({ container: d3.select("#pie") });

    filter(data, ctrl, charts, true); 

    var navigation = navig.widget(navConfig, navigationState, charts);    


    componentDefinitions["nav"] = {
        component: navigation,
        config: navConfig,
        name: "nav"
    };

    layout.enable($(containerSelector), componentDefinitions);
    navigation.reset();
});
define("test", ["znd-graph-core", "znd-graph-navigation", "znd-graph-controls", "znd-graph-filtering",
    "znd-graph-config", "znd-graph-layout", "znd-graph-colors", "znd-testdata", "lodash", "util",
    "jquery", "d3"
  ],

  function(app, navig, controls, filter, globalConfig, layout, colors, testdata, _, util, $, d3) {
    "use strict";

    var containerSelector = "#graph",
      data = testdata,
      segments = 5,
      initialWidth = $(containerSelector).width() - 15;

    var navigationState = navig.state(data.x.length, segments, 1);

    var chartConfigs = {

      pie: {
        barHeight: 30,
        container: d3.select(containerSelector + " .bar")
      },

      bar: {
        height: 400,
        container: d3.select(containerSelector + " .area"),
        max: util.detectMaximum(data) * 1.6
      },

      timeline: {
        itemHeight: 50,
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

      return {
        component: chart,
        config: config,
        name: chartName
      };
    }), 'name');

    var charts = _.pluck(_.values(componentDefinitions), 'component');

    // init controls
    var ctrl = controls({
      container: d3.select("#pie")
    });

    //init filtering
    filter(data, ctrl, charts, true);

    //init navigation
    var navigation = navig.widget(navConfig, data, navigationState, charts);

    // add navi to components
    componentDefinitions["nav"] = {
      component: navigation,
      config: navConfig,
      name: "nav"
    };

    // start the layout watch and kick it off

    layout.enable($(containerSelector), componentDefinitions);
    layout.start();


  });

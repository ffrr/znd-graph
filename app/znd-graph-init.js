require(["znd-graph-core", "znd-graph-navigation", "znd-graph-controls", "znd-graph-filtering",
    "znd-graph-config", "znd-graph-layout", "znd-graph-colors", "znd-graph-data", "znd-graph-support", "lodash", "util",
    "jquery", "d3", "domready"
  ],

  function(app, navig, controls, filter, globalConfig, layout, colors, unprocessedData, support, _, util, $, d3, domready) {
    "use strict";

    domready(function() {

      _.templateSettings = {
        interpolate: /<@=([\s\S]+?)@>/g,
        evaluate: /<@([\s\S]+?)@>/g
      };
      var containerSelector = globalConfig.containerSelector || "#graph",
        data = support.preprocessGraphInputData(unprocessedData),
        segments = data.x.length < 5 ? data.x.length:5,
        initialWidth = $(containerSelector).width() - 15,
        groupingThreshold = globalConfig.groupingThreshold || 1;



      var chartConfigs = {

        pie: {
          barHeight: globalConfig.pieHeight || 30, //extract to defaults
          container: d3.select(containerSelector + " .bar")
        },

        bar: {
          height: globalConfig.barHeight || 400,
          container: d3.select(containerSelector + " .area"),
          max: util.detectMaximum(data) * 1.6
        },

        timeline: {
          itemHeight: globalConfig.timelineItemHeight || 50,
          container: d3.select(containerSelector + " .timeline")
        }
      };

      var navConfig = {
        container: $(globalConfig.navigationContainerSelector || ".navigable")
      };

      //enlargeContainerToVisibleParent(containerSelector);

      var navigationState = navig.state(data.x.length, segments, 1);

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
        container: $(globalConfig.controlContainerSelector || "#pie")
      });

      //init filtering
      filter(data, ctrl, charts, data.series.length > groupingThreshold + 1 );

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


      // need a deferred recalc because of the overflows, changes container width
      _.defer(function() {
        layout.start();
        util.bus.fire("groupingToggled", [false]);
      });
    });


  });

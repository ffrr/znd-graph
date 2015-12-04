"use strict";

define("test", ["znd-graph", "lodash", "util", "znd-graph-navigation", "znd-graph-controls", "znd-graph-filtering", "znd-graph-config"], function(app, _, util, navig, controls, filter, globalConfig) {
    

    var containerSelector = "#graph";

    var points = { 
        series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
        x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,
        y: [[50, 10, 20], [0, 0, 0], [0, 0, 0], [50, 20, 28], [20, 15, 30], [150, 13, 50 ], [100, 60, 40]],
        timeline: [[
            { position: "Štatutár", ranges: [[2005, 2008]] },
            { position: "Zástupca riaditeľa", ranges: [[2008, 2009]] }
        ],[
            { position: "Štatutár", ranges: [[2005, 2007], [2009, 2010]] },
            { position: "Zástupca riaditeľa", ranges: [[2005, 2008]] }
        ],[
            { position: "Kotolník", ranges: [[2005, 2011]] },
        ]]
    }; 

    points.x = points.x.map(function(year) {
        return util.yearStart(year);
    });

    var points2 = { 
        series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
        x: [2006, 2007, 2008, 2009, 2010, 2011, 2012] ,
        y: [[60, 10, 40], [60, 10, 40], [20, 70, 15], [20, 15, 30], [150, 13, 50 ], [100, 60, 40], [30, 20, 10]],
        timeline: [[
            { position: "Štatutár", ranges: [[2005, 2008]] },
            { position: "Zástupca riaditeľa", ranges: [[2008, 2009]] }
        ],[
            { position: "Štatutár", ranges: [[2005, 2007], [2009, 2010]] },
            { position: "Zástupca riaditeľa", ranges: [[2005, 2008]] }
        ],[
            { position: "Kotolník", ranges: [[2005, 2011]] },
        ]]
    };


    points2.x = points2.x.map(function(year) {
        return util.yearStart(year);
    });

    var points3 = { 
        series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
        x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,
        y: [[60, 10, 40], [60, 10, 40], [20, 70, 15], [20, 15, 30], [150, 13, 50 ], [100, 60, 40], [30, 20, 10]],
        timeline: [[
            { position: "Štatutár", ranges: [["2005-03-01", "2008-02-01"]] },
            { position: "Zástupca riaditeľa", ranges: [["2008-08-08", "2009-05-02"]] },
        ],[
            { position: "Štatutár", ranges: [["2005-02-03", "2007-09-27"], ["2009-12-12", "2010-01-01"]] },
            { position: "Zástupca riaditeľa", ranges: [["2005-06-01", "2008-11-18"]] }
        ],[
            { position: "Kotolník", ranges: [["2005-04-04", null]] },
        ]]
    };

    points3.x = points3.x.map(function(year) {
        return util.yearStart(year);
    });

    points3.timeline = points3.timeline.map(function(series) {
        
        return series.map(function(position) {
            position.ranges = _.map(position.ranges, function(range) {
                return _.map(range, function(dateStr) {
                    return typeof dateStr === "string" ? new Date(Date.parse(dateStr)):null;
                })
            });
            return position;
        })
    });
    
    var areaConfig = {
        width: $(containerSelector).width() - 15, height: 400,
        segments: 5,
        container: d3.select(containerSelector + " .area"),
        max: _.max(_.map(points.y, function(item) { return _.reduce(item, util.sum)})) * 1.6
    },  areaConfig2 = {
        width: 660, height: 400,
        container: d3.select(containerSelector + " .area")
    };

    
    var timelineConfig = {
        width: areaConfig.width,
        segments: 5,
        itemHeight: 40,
        container: d3.select(containerSelector + " .timeline")
    };

    
    var barChartConfig = {
        width: areaConfig.width,
        barHeight: 30,
        amountTickSuffix: areaConfig.amountTickSuffix,
        container: d3.select(containerSelector + " .bar")
    };


    var navConfig = {
        container: d3.select(containerSelector),
        left: d3.select(containerSelector + " .pan.left"),
        right: d3.select(containerSelector + " .pan.right")
    };

    
    globalConfig.colors.init(points3.series);

    _.each([timelineConfig, barChartConfig, areaConfig], function(obj) {
        _.assign(obj, { color: globalConfig.colors.getColor })
    });

    var hbc = app.horizontalBarChart(barChartConfig, points3);
    hbc.reset();

    var gr = app.barGraph(areaConfig, points3/*window_(points, [0,4])*/);
    gr.reset();
    
    var tm = app.timeline(timelineConfig, points3);
    tm.reset();

    var ctrl = controls({ container: d3.select("#pie") });

    filter(points3, ctrl, [gr, tm, hbc], true);

    navig.widget(navConfig, [gr, tm]);

    $(window).resize(util.onResizeEnd(function() {
        barChartConfig.width = areaConfig.width = timelineConfig.width = $(containerSelector).width(),
        gr.reset(points3, areaConfig);
        tm.reset(points3, timelineConfig);
        hbc.reset(points3, barChartConfig);
    }));
});
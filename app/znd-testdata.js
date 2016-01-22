"use strict";

define("znd-testdata", ["util"], function(util) {

  var points3 = { 
        series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
        x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,
        y: [[60, 10, 40], [60, 12, 40], [20, 70, 15], [20, 15, 30], [150, 13, 50 ], [100, 60, 40], [30, 20, 10]],
        timeline: [[
            { position: "Štatutár", ranges: [["2005-03-01", "2008-02-01"]] },
            { position: "Zástupca riaditeľa", ranges: [["2008-08-08", "2009-05-02"]] },
        ],[
            { position: "Štatutárka", ranges: [["2005-02-03", "2007-09-27"], ["2009-12-12", "2010-01-01"]] },
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

    return points3;

});
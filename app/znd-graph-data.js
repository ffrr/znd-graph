define("znd-graph-data", [], function() {
  "use strict";

  var data = {
        series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
        x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,
        y: [[60, 10, 40], [60, 1232300, 40], [20, 70, 15], [20, 15, 30], [150, 13, 50 ], [100, 60, 40], [30, 20, 10]],
        timeline: [[
            { position: "Štatutár", ranges: [["2003-03-01", "2008-02-01"]] },
            { position: "Zástupca riaditeľa", ranges: [["2003-08-08", "2009-05-02"]] },
        ],[
            { position: "Štatutárka", ranges: [["2003-02-03", "2007-09-27"], ["2009-12-12", "2010-01-01"]] },
            { position: "Zástupca riaditeľa", ranges: [["2005-06-01", "2008-11-18"]] }
        ],[
            { position: "Kotolník", ranges: [["2006-04-04", null]] },
        ]]
    };

  // var data = {
  //   series: ["MIM, s.r.o."],
  //   x: [2004, 2005, 2006, 2007],
  //   y: [[0], [0], [0], [268870.74]],
  //   timeline: [[{ position : "Spoločník v.o.s. / s.r.o.", ranges : [["2004-01-23", null ]]}]]
  // };

  // var data = {
  //   series: ["MIM, s.r.o."],
  //   x: [2002],
  //   y: [[268870.74]],
  //   timeline: [[{ position : "Spoločník v.o.s. / s.r.o.", ranges : [["2010-01-23", "2010-01-24" ]]}]]
  // };

  return data;
});

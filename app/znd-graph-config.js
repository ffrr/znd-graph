"use strict";
define("znd-graph-config", ["d3", "lodash"], function(d3, _) {

    var config = {
        colors: [ "00d4ff", "ff92d7", "ffc900", "00c367", "ada9ff", "fff300",
        "ff4dd8", "007cff", "ff8600", "00acd5", "ff4d00", "00d21d",
        "b97aff", "00deb9", "c7344f" ],
        
        spritesPath: "app/3rd-party/svg/sprite.svg",
        groupingAggregateName: "Ostatné",
        containerSelector: "#graph",
        
        pie: "pie",
        bar: "bar",
        timeline: "timeline",
        nav: "nav",

        layout: {
            MOBILE: "mobile",
            DESKTOP: "desktop"
        }
    };

    config.layouts = _.values(config.layout);

    return config;
});

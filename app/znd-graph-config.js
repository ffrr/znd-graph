define("znd-graph-config", [], function() {
    "use strict";
    var config = {
        colors: [ "00d4ff", "ff92d7", "ffc900", "00c367", "ada9ff", "fff300",
        "ff4dd8", "007cff", "ff8600", "00acd5", "ff4d00", "00d21d",
        "b97aff", "00deb9", "c7344f" ],

        spritesPath: "app/3rd-party/svg/sprite.svg",

        containerSelector: "#graph",
        controlContainerSelector: "#pie",
        navigationContainerSelector: ".navigable",

        groupingAggregateName: "Ostatné",
        visibleSegments: 5,
        groupingThreshold: 1,

        pieHeight: 30,
        barHeight: 400,
        timelineItemHeight: 50
    };

    return config;
});

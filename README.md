# Graph component for znasichdani.sk

A graph component for the upcoming update of znd, made in d3.js.

## Basic configuration

### znd-graph-config.js
~~~~javascript
define("znd-graph-config", [], function() {
    "use strict";

    var config = {

        /**
         * colors (array[string]) - Hexadecimal color codes used for successive
         * data series
         **/
        colors: [ "00d4ff", "ff92d7", "ffc900", "00c367", "ada9ff", "fff300",
        "ff4dd8", "007cff", "ff8600", "00acd5", "ff4d00", "00d21d",
        "b97aff", "00deb9", "c7344f" ],

        /**
         * spritesPath (string) - Relative path to the svg sprite container.
         **/
        spritesPath: "system/svg/sprite.svg",

        /**
         * groupingAggregateName (string) - The name for the aggregate series
         * which groups all the series which fall above the grouping threshold
         * (see below)
         **/
        groupingAggregateName: "Ostatné",

        /**
         * visibleSegments (int) - How many segments of the bar graph should
         * be fitted onto the screen.
         **/
        visibleSegments: 5,

        /**
         * groupingThreshold (int) - Amount of data series shown fully.
         * If the total number series passes this threshold, they get
         * collapsed and the expand / collapse functionality is activated
         * automatically.
         **/
        groupingThreshold: 5,

        /**
         * pieHeight (int) - The height of the pie graph in px.
         **/
        pieHeight: 30,

        /**
         * barHeight (int) - The height of the bar graph in px.
         **/
        barHeight: 400,

        /**
         * timelineItemHeight (int) - The height of one item in the timeline.
         */
        timelineItemHeight: 50,

        /**
         * containerSelector (string) - CSS selector for the container in which
         * the main element graph is to be rendered
         **/
        containerSelector: "#graph",

        /**
         * controlContainerSelector (string) - CSS selector for the container
         * encapsulating the control elements (filtering, grouping)
         **/
        controlContainerSelector: "#pie",

        /**
         * containerSelector (string) - CSS selector for the container
         * encapsulating the navigation panes
         **/
        navigationContainerSelector: ".navigable"

    };

    return config;
});
~~~~

### znd-graph-data.js
~~~~javascript
define("znd-graph-data", function() {
  "use strict";

  var data = {
        /**
         * series (array[string]) - Names of the data series - i.e. the names
         * of companies present in the procurement data for the person searched.
         **/
        series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],

        /**
         * x (array(int) - Years, for which the procurement data exist.
         **/
        x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,

        /**
         * y (array(array(int)) - A matrix of procurement sums in EUR for each
         * data series, can be denoted as y[yearIndex][seriesIndex]. E.g. Given
         * that x[0] is 2005 and series[0] is "Plastika Nitra", then
         * y[0][0] = 60 is the sum of procurement money earned by Plastika
         * Nitra in the year 2005. )
         **/
        y: [[60, 10, 40], [60, 1232300, 40], [20, 70, 15], [20, 15, 30],
        [150, 13, 50 ], [100, 60, 40], [30, 20, 10]],

        /**
         * timeline (array(array(object(string, array(string)) - The timeline
         * data structure. I.e. again, as above, timeline[0] contains positions
         * occupied in the company "Plastika Nitra".
         **/
        timeline: [[
            /**
             * position (string) - The name of the position in the company
             * occupied by the person searched.
             * ranges (array(array(string)) - Dates denoting the time intervals
             * during which the person searched occupied the above position.
             * There may be multiple intervals for the given position. Also,
             * the intervals may not have an upper or lower boundary (at least
             * one of the boundaries is necessary though).
             **/
            { position: "Štatutár", ranges: [["2005-03-01", "2008-02-01"]] },
            { position: "Zástupca riaditeľa",
              ranges: [["2008-08-08", "2009-05-02"]] },
        ],[
            { position: "Štatutárka", ranges: [["2005-02-03", "2007-09-27"],
              ["2009-12-12", "2010-01-01"]] },
            { position: "Zástupca riaditeľa", ranges: [["2005-06-01", "2008-11-18"]] }
        ],[
            { position: "Kotolník", ranges: [["2005-04-04", null]] },
        ]]
    };

    return data;
});
~~~~

"use strict";
define("znd-graph-config", ["d3", "lodash"], function(d3, _) {

    var groupingAggregateName = "Ostatné";
    return {
    	// this has to be redone
    	// initialize with initial data colors.init(data.series)
    	// and then keep the colors
        colors: function() {
			var _export, mappedColors, colorRange = [
				"00d4ff", "ff92d7", "ffc900", "00c367", "ada9ff", "fff300",
		    	"ff4dd8", "007cff", "ff8600", "00acd5", "ff4d00", "00d21d",
		    	"b97aff", "00deb9", "c7344f"
			];

        	var init = function(seriesList) {
        		mappedColors = _.zipObject(seriesList, colorRange);
                mappedColors[groupingAggregateName] = "ffffff";
        	}, getColor = function(s) {
        		return d3.rgb("#" + mappedColors[s]);
        	};

        	_export = {
        		init: init,
        		getColor: getColor
        	}

        	return _export;
        }(),

        spritesPath: "system/svg/sprite.svg",
        groupingAggregateName: groupingAggregateName
    };
});

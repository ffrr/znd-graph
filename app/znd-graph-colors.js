define("znd-graph-colors", ["znd-graph-config"], function(globalConfig) {
	var _export, mappedColors, colorRange = globalConfig.colors;

    // this has to be redone
    // initialize with initial data colors.init(data.series)
    // and then keep the colors

	var init = function(seriesList) {
		mappedColors = _.zipObject(seriesList, colorRange);
        mappedColors[globalConfig.groupingAggregateName] = "ffffff";
	}, getColor = function(s) {
		return d3.rgb("#" + mappedColors[s]);
	};

	_export = {
		init: init,
		getColor: getColor
	}

	return _export;
});
define("znd-graph-colors", ["znd-graph-config", "d3", "lodash", "znd-graph-locale"], function(globalConfig, d3, _, locale) {
  var _export, mappedColors, colorRange = globalConfig.colors;

  // this has to be redone
  // initialize with initial data colors.init(data.series)
  // and then keep the colors

  var init = function(seriesList) {
      mappedColors = _.zipObject(seriesList, colorRange);
      mappedColors[locale("filter.grouping-aggregate")] = "ffffff";
    },
    getColor = function(s) {
      return d3.rgb("#" + mappedColors[s]);
    };

  _export = {
    init: init,
    getColor: getColor
  };

  return _export;
});

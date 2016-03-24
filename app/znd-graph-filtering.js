define("znd-graph-filtering", ["lodash", "util", "znd-graph-grouping"], function(_, util, grouping) {
  "use strict";
  var filter = function(data, controls, graphs, enableGrouping) {
    var aggregatedSeriesList = [];

    if (enableGrouping) {
      var preprocessed = grouping.preprocess(data);
      aggregatedSeriesList = preprocessed[1];
      data = preprocessed[0];
    }

    var activeSeries = _.clone(data.series),
      summedSeries = grouping.aggregateName;

    var resetGraphs = function(newData) {
        _.each(graphs, function(graph) {
          graph.reset(newData);
        });
      },

      getSeriesIndex = function(series) {
        return data.series.indexOf(series);
      },

      removeFromClone = function(seriesList) {

        var clone = _.cloneDeep(data),
          idxs = _.map(seriesList, getSeriesIndex);
        _.pullAt(clone.series, idxs);
        _.pullAt(clone.timeline, idxs);
        clone.y = _.map(clone.y, function(item) {
          _.pullAt(item, idxs);
          return item;
        });

        return clone;
      },

      addSeries = function(series) {
        activeSeries.push(series);
        return removeFromClone(_.difference(data.series, activeSeries));
      },

      removeSeries = function(series) {
        activeSeries = _.without(activeSeries, series);
        return removeFromClone(_.difference(data.series, activeSeries));
      },

      group = function() {
        activeSeries = _.without.apply(null, _.flatten([
          [data.series], aggregatedSeriesList
        ]));
        activeSeries.push(summedSeries);
        return removeFromClone(_.difference(data.series, activeSeries));
      },

      ungroup = function() {
        activeSeries = _.without(data.series, summedSeries);
        activeSeries.push(aggregatedSeriesList);
        activeSeries = _.flatten(activeSeries);
        return removeFromClone(_.difference(data.series, activeSeries));
      },

      applyGrouping = function() {
        var newData = group();
        _.each(graphs, function(graph) {
          graph.reset(newData);
        });
        controls.reset(newData);
      },

      unapplyGrouping = function() {
        var newData = ungroup();
        _.each(graphs, function(graph) {
          graph.reset(newData);
        });
        controls.reset(newData);
      },

      isActive = function(series) {
        return _.contains(activeSeries, series);
      },

      filterSeries = function(series, state) {
        var doRemove = isActive(series) && !state,
          doAdd = !isActive(series) && state;
        if (doRemove) {
          return removeSeries(series);
        }

        if (doAdd) {
          return addSeries(series);
        }

        // otherwise do jack shit
        return data;
      };


    var initialData = removeSeries(summedSeries);

    controls.reset(initialData);

    controls.onSeriesToggled(function(evt, series, state) {
      resetGraphs(filterSeries(series, state));
    });

    controls.onGroupingToggled(function(evt, state) {
      if (state) {
        unapplyGrouping();
      } else {
        applyGrouping();
      }
    });

  };

  return filter;

});

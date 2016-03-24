
define("znd-graph-grouping", ["lodash", "util", "znd-graph-config"], function(_, util, globalConfig) {
    "use strict";

    var aggregateName = globalConfig.groupingAggregateName;

    var preprocessDataForGrouping = function(data, threshold) {
        return addAggregatedByThresholdTo(sortByAggregateSum(data), threshold);
    };

    var hasGrouping = function(data) {
        return _.contains(data.series, aggregateName);
    };

    var addAggregatedByThresholdTo = function(data, threshold) {

        var threshold = threshold || 1, cloned = _.cloneDeep(data), remainingCount = data.series.length - threshold,
            aggregatedSeriesList = _.takeRight(cloned.series, remainingCount);

        cloned.series.push(aggregateName);

        cloned.y = _.map(data.y, function(arr) {
            arr.push(
                _.reduce(_.takeRight(arr, remainingCount), util.sum)
            );
            return arr;
        });

        return [cloned, aggregatedSeriesList];
    };

    var sortByAggregateSum = function(data) {

        var cloned = _.cloneDeep(data),
            descending = _.sortBy(_.zip(data.series, util.aggregates(data)), function(pair) { return -pair[1]; }),

            indexes = _.map(descending, function(pair) { return _.indexOf(data.series, pair[0]); });

            cloned.y = _.map(data.y, function(arr) {
                return _.map(indexes, function(index) {
                    return arr[index]; }
                );
            });

            cloned.series = _.map(indexes, function(index) {
                return data.series[index];
            });

            cloned.timeline = _.map(indexes, function(index) {
                return data.timeline[index];
            });

        return cloned;
    };

    return {
        aggregateName: aggregateName,
        preprocess: preprocessDataForGrouping,
        isGrouped: hasGrouping
    };

});

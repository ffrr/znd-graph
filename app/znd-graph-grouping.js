"use strict";
define("znd-graph-grouping", ["lodash", "util", "znd-graph-config"], function(_, util, globalConfig) {

    var aggregateName = globalConfig.groupingAggregateName;

    var preprocessDataForGrouping = function(data, threshold) {
        return addAggregatedByThresholdTo(sortByAggregateSum(data), threshold);
    };

    var hasGrouping = function(data) {
        return _.contains(data.series, aggregateName);
    };

    var addAggregatedByThresholdTo = function(data, threshold) {
        //above = _.take(descending, threshold), below = _.takeRight(descending, descending.length - threshold),

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

            // data.y = _.map(data.y, function(arr) { _.map(arr,) })
        // var points = { 
  //       series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
  //       x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,
  //       y: [[50, 10, 20], [0, 0, 0], [0, 0, 0], [50, 20, 28], [20, 15, 30], [150, 13, 50 ], [100, 60, 40]],
  //       timeline: [[
  //           { position: "Štatutár", ranges: [[2005, 2008]] },
  //           { position: "Zástupca riaditeľa", ranges: [[2008, 2009]] }
  //       ],[
  //           { position: "Štatutár", ranges: [[2005, 2007], [2009, 2010]] },
  //           { position: "Zástupca riaditeľa", ranges: [[2005, 2008]] }
  //       ],[
  //           { position: "Kotolník", ranges: [[2005, 2011]] },
  //       ]]
 


        // //sort by aggregated

        // if(data.series.length > threshold) {

        // }



    var sortByAggregateSum = function(data) {

        var cloned = _.cloneDeep(data),
            descending = _.sortBy(_.zip(data.series, util.aggregates(data)), function(pair) { return -pair[1]; }),

            indexes = _.map(descending, function(pair) { return _.indexOf(data.series, pair[0]); });
            
            cloned.y = _.map(data.y, function(arr) { 
                return _.map(indexes, function(index) { 
                    return arr[index]; } 
                )
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



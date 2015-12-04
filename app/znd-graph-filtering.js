"use strict";
define("znd-graph-filtering", ["lodash", "util", "znd-graph-grouping"], function(_, util, grouping) {

    var filter = function(data, controls, graphs, enableGrouping) {
        
        var aggregatedSeriesList = [];

        if(enableGrouping) {
            var preprocessed = grouping.preprocess(data);
            aggregatedSeriesList = preprocessed[1];            
            data = preprocessed[0];
        }

        var activeSeries = _.clone(data.series), summedSeries = grouping.aggregateName;
        
        var resetGraphs = function(newData) {
            _.each(graphs, function(graph) {
                graph.reset(newData);
            });
        },
        
        resetAll = function(newData) {
            resetGraphs(newData);
            controls.reset(newData);
        },

        group = function() {
            activeSeries = _.without.apply(null, _.flatten([[activeSeries], aggregatedSeriesList]));
            activeSeries.push(summedSeries);
            return removeFromClone(_.difference(data.series, activeSeries));
        },

        ungroup = function() {
            activeSeries = _.without(activeSeries, summedSeries);
            activeSeries = _.flatten(activeSeries.push(aggregatedSeriesList));
            return removeFromClone(_.difference(data.series, activeSeries));  
        },
    
    	getSeriesIndex = function(series) {
    		return data.series.indexOf(series);
        },

        isActive = function(series) {
        	return _.contains(activeSeries, series);
        },

        filterSeries = function(series, state) {
            var doRemove = isActive(series) && !state, doAdd = !isActive(series) && state;  
            if(doRemove) return removeSeries(series);
            if(doAdd) return addSeries(series);

            // otherwise do jack shit
            return data;
		},

        addSeries = function(series) {
            activeSeries.push(series);
            return removeFromClone(_.difference(data.series, activeSeries));
        },

        removeSeries = function(series) {
            activeSeries = _.without(activeSeries, series);
            return removeFromClone(_.difference(data.series, activeSeries));
        },


    	removeFromClone = function(seriesList) { 

            var clone = _.cloneDeep(data), idxs = _.map(seriesList, getSeriesIndex);            
            _.pullAt(clone.series, idxs);
            _.pullAt(clone.timeline, idxs);
            clone.y = _.map(clone.y, function(item) { _.pullAt(item, idxs); return item; });
            
    		return clone;
        };

        resetAll(removeSeries(summedSeries));

        controls.onSeriesToggled(function(evt, series, state) {
            resetGraphs(filterSeries(series, state));
        });

        controls.onGroupingToggled(function(evt, state) {
            resetAll(state ? ungroup():group());
        });
        
    };

    return filter;

});



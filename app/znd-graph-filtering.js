"use strict";
define("znd-graph-filtering", ["lodash", "util",], function(_, util) {

    var filter = function(data, controls, graphs) {
        var activeSeries = data.series; // keep current state here - beware the grouping clash, will probably have to unite these somehow
        
        var resetData = function(newData) {
	        _.each(graphs, function(graph) {
	            graph.reset(newData);
	        });
        }, 	
    
    	getSeriesIndex = function(series) {
    		return data.series.indexOf(series);
        },

        isActive = function(series) {
        	return _.contains(activeSeries, series);
        },

        filterSeries = function(series, state) {
        	if(isActive(series) && !state) {
        		return removeSeries([series]);
        	} else if(!isActive(series) && state) {
        		activeSeries.push(series); // push back into active series
        		return removeSeries(_.difference(data.series, activeSeries)); // and remove the difference between the initial series and the active series
        	}

        	// otherwise do jack shit
		},

    	removeSeries = function(seriesList) { // always removes from initial clone, kinda misnamed ? todo: refactor
    		var clone = _.cloneDeep(data), idxs = _.map(seriesList, getSeriesIndex);
    		

    		_.each(idxs, function(idx) { 

    			_.pull(activeSeries, seriesList[idx]);

    			_.pullAt(clone.series, idx); 

	    		_.each(["y", "timeline"], function(key) {
	    			clone[key] = _.map(clone[key], function(item) { _.pullAt(item, idx) });
	    		});

    		});

    		return clone;
        };

        controls.onSeriesToggled(function(evt, series, state) {
        	resetData(filterSeries(series, state));
        });
        
    };

    return filter;

}
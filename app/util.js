"use strict";
define("util",["lodash", "jquery"], function(_, $) {
    var export_ = {
        yearStart: function(year) { 
            return new Date(year, 0, 1); 
        },

        yearMid: function(year) { 
            return new Date(year, 6, 1); 
        },
        
        yearEnd: function(year) { 
            return new Date(year, 11, 31); 
        },
        
        sum: function(sum, curr) { 
            return (sum || 0) + curr 
        },      
        
        onResizeEnd: function(callback) {
            var resizeId;
            return function(evt) {
                clearTimeout(resizeId);
                resizeId = setTimeout(callback, 350, evt);
            };
        },

        randomId: function() { 
            return "" + Math.round(Math.random() * 1e6) + "-" + (new Date().getTime() + "").slice(6); 
        }

    };

    var bus = {
        on: _.bind($(document).on, $(document)),
        //off: _.curry($.fn.off)(document),
        fire: _.bind($(document).trigger, $(document))
    };


    var aggregates = function(data)  {
        return _.zip.apply(null, data.y).map(function(arr) { //get the aggregated sum of each series
            return _.reduce(arr, export_.sum);
        }); 
    }, totals = function(data) {
        return _.reduce(aggregates(data), export_.sum);
    };

    _.assign(export_, { aggregates: aggregates, totals: totals, bus: bus })

    return export_;
});
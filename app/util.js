"use strict";
define("util",["lodash", "jquery", "d3"], function(_, $, d3) {
    
    var dateTemplate = 
        _.template("<%= date.getDate() %>. <%= date.getMonth() + 1 %>. <%= date.getFullYear() %>")

    var export_ = {
        yearStart: function(year) { 
            return new Date(year, 0, 1); 
        },

        formatDate: function(date) {
            return dateTemplate({ date: date });
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

        toD3Node: function(jQueryNodes) {
            return d3.select(jQueryNodes.get()[0]);
        },

        toJqueryNode: function(d3Node) {
            return $(d3Node.node())
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
        },

        //shameless steal from http://eng.rightscale.com/2015/01/22/lodash-extensions.html
        clamp: function(value, minimum, maximum) {
          if (maximum == null) {
            maximum = Number.MAX_VALUE;
          }
          if (maximum < minimum) {
            var swap = maximum;
            maximum = minimum;
            minimum = swap;
          }
          return Math.max(minimum, Math.min(value, maximum));
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

    var mixin = function(module, mixin) {
        return function() {
            var exp = module.apply(null, arguments);
            _.each(mixin, function(property, key) {
                if(_.isFunction(property)) _.bind(property, exp);
            });
            return _.assign(exp, mixin);
        };
    };

    _.assign(export_, { aggregates: aggregates, totals: totals, bus: bus, mixin: mixin})

    return export_;
});
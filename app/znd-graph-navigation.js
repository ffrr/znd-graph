"use strict";
define("znd-graph-navigation", ["lodash"], function(_) {

    var navigationWidget = function(config, graphs) {
        var cont = config.container,
            left = config.left,
            right = config.right,

            toggle = function(element, t) {
                element.style("visibility", t ? "visible":"hidden");
            },
            evaluateVisibility = function() {
                toggle(left, !graph.depleted());
                toggle(right, !graph.maxed());
            };

        left.on("click", function() { _.each(graphs, function(g) { g.left(); }); });
        right.on("click", function() { _.each(graphs, function(g) { g.right(); }); });

    };


    var navigationFn = function(full, windowWidth, step) {

        var cursor = 0, used = false, windowWidth = (windowWidth != null || windowWidth != undefined) ? windowWidth:3, 
            
            back = function() {
                if(!depleted())  {
                    cursor -= 1;
                }
                return compensate();
            },

            forward = function() {
                if(!maxed()) {
                    cursor  += 1;
                }
                return compensate();
            },

            current = function() {
                return used ? compensate():last();
            },

            first = function() {
                cursor = 0;
                return compensate();
            },

            last = function() {
                cursor = full - (windowWidth * step);
                return compensate();
            },

            compensate = function() {
                used = true;
                return Math.min(full, cursor * step);
            },

            depleted = function() {
                return cursor === 0;
            },

            maxed = function() {
                var outerRange = cursor * step + windowWidth;
                return outerRange >= full;
            };

        return {
            back: back,
            forward: forward,
            first: first,
            last: last,
            current: current
        };
    };

    return {
        widget: navigationWidget,
        navigation: navigationFn
    };

});
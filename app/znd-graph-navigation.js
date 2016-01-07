"use strict";
define("znd-graph-navigation", ["lodash", "jquery", "znd-graph-config"], function(_, $, globals) {

    var widget = function(config, state, graphs) {
        var left, right, currentLayout,

            cont = config.container,
            tplPrefix = "tpl", navigPrefix = "navig",
            layout = globals.layout,
            layouts = _.values(layout),

            cachedTemplates = _.zipObject(layouts, _.map(layouts, function(layoutType) {
                return _.template(getTplContent(layoutType));
            })),

            reset = function(config) {
                if(currentLayout) getNavig(currentLayout).remove();
                currentLayout = _.contains(layouts, config.layout) ? config.layout:layout.DESKTOP;
                
                cont.prepend(cachedTemplates[config.layout](model));

                left = getNavig(currentLayout).down(".left");
                right = getNavig(currentLayout).down(".right");

            },

            applyBehavior = function() {
                left.on("click", function() { _.each(graphs, function(g) { g.left(); }); });
                right.on("click", function() { _.each(graphs, function(g) { g.right(); }); });                
            },

            getTplContent = function(layoutType) {
                return $("#" + [tplPrefix, navigPrefix, layoutType].join("-")).html();
            },

            getNavig = function(layoutType) {
                return $("#" + [navigPrefix, layoutType].join("-"));
            },

            toggle = function(element, t) {
                element.style("visibility", t ? "visible":"hidden");
            },

            evaluateVisibility = function() {
                toggle(left, !graph.depleted());
                toggle(right, !graph.maxed());
            };
    };


    var stateSupport = function(full, windowWidth, step) {

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
        widget: widget,
        state: stateSupport
    };

});
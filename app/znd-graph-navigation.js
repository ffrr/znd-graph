"use strict";
define("znd-graph-navigation", ["lodash", "jquery", "znd-graph-config", "znd-graph-layout"], function(_, $, globals, layout) {

    var widget = function(initialConfig, state, charts) {

        var tabs = { back: null, forward: null }, currentConfig,
            keyMap = { 37: "back", 39: "forward" },
            cont = initialConfig.container,
            tplPrefix = "tpl", navigPrefix = "navig";

        var getTplContent = function(layoutType) {
                return $("#" + [tplPrefix, navigPrefix, layoutType].join("-")).html();
            },

            getNavig = function(layoutType) {
                return $("#" + [navigPrefix, layoutType].join("-"));
            },

            cachedTemplates = _.zipObject(globals.layouts, _.map(globals.layouts, function(layoutType) {
                return _.template(getTplContent(layoutType));
            })),

            reset = function(newConfig) {
                currentConfig = newConfig || initialConfig;
                resetLayout();
                applyBehaviors();
                evaluateTabVisibility();
            },

            resetState = function() {
                if(layout.isMobile()) state.changeWindowWidth(1);
                else state.changeWindowWidth(3);
            },

            resetLayout = function() {
                state.applyLayout();

               _.each(charts, function(chart) { 
                    if(chart.pan) chart.pan(state.first()); 
                });


                var currentNavig = getNavig(layout.getCurrent());
                if(currentNavig) currentNavig.remove();

                cont.prepend(cachedTemplates[layout.getCurrent()]());

            },

            applyBehaviors = function() {
                _.each(_.keys(tabs), function(dir) {
                    tabs[dir] = getNavig(layout.getCurrent()).children("." + dir).first();
                    tabs[dir].on("click", function() {
                        handleShiftingEvent(dir);
                    });
                });

                $(document).on("keydown", function(evt) {
                    var dir = keyMap[evt.keyCode];
                    if(dir) handleShiftingEvent(dir);
                });
            },

            handleShiftingEvent = function(dir) {
                doShift(dir);
                evaluateTabVisibility();
            },

            doShift = function(dir) {
                var position = state[dir]();

                _.each(charts, function(chart) { 
                    if(chart.pan) chart.pan(position); 
                });
            },         

            evaluateTabVisibility = function() {
                tabs.back.toggle(!state.depleted());
                tabs.forward.toggle(!state.maxed());
            };

        return {
            reset: reset,
            resize: reset,
            type: globals.nav
        };
    };


    var stateSupport = function(full, initialWindowWidth, step) {

        var cursor = 0, used = false, windowWidth = initialWindowWidth,
            
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
            },

            applyLayout = function() {
                if(layout.isMobile()) windowWidth = 1;
                else windowWidth = initialWindowWidth;
            };

        return {
            back: back,
            forward: forward,
            first: first,
            last: last,
            current: current,
            maxed: maxed,
            depleted: depleted,
            applyLayout: applyLayout
        };
    };

    return {
        widget: widget,
        state: stateSupport
    };

});
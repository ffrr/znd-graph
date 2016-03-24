define("znd-graph-navigation", ["lodash", "jquery", "znd-graph-config", "znd-graph-layout", "util"], function(_, $, globals, layout, util) {
  "use strict";
  var widget = function(initialConfig, initialData, state, charts) {

    var tabs = {
        back: null,
        forward: null
      },
      currentConfig,
      keyMap = {
        37: "back",
        39: "forward"
      },
      cont = initialConfig.container,
      tplPrefix = "tpl",
      navigPrefix = "navig",
      prevNavig, data = initialData;

    var getTplContent = function(layoutType) {
        return $("#" + [tplPrefix, navigPrefix, layoutType].join("-")).html();
      },

      getNavig = function(layoutType) {
        return $("#" + [navigPrefix, layoutType].join("-"));
      },

      cachedTemplates = _.zipObject(globals.layouts, _.map(globals.layouts, function(layoutType) {
        return _.template(getTplContent(layoutType));
      })),


      panToStart = function() {
        _.each(charts, function(chart) {
          if (chart.pan) {
            chart.pan(state.first());
          }
        });
      },

      getModel = function() {
        if (layout.isMobile()) {
          return _.mapValues({
            prevYear: data.x[state.current() - 1],
            nextYear: data.x[state.current() + 1],
            currentYear: data.x[state.current()],
            currentTotal: _.reduce(data.y[state.current()], util.sum)
          }, function(value, key) {
            return value instanceof Date ? value.getFullYear():value;
          });
        }
      },

      doShift = function(dir) {
        var position = state[dir]();

        _.each(charts, function(chart) {
          if (chart.pan) {
            chart.pan(position);
          }
        });

      },

      evaluateTabVisibility = function() {
        tabs.back.toggle(!state.depleted());
        tabs.forward.toggle(!state.maxed());
      },

      handleShiftingEvent = function(dir) {
        doShift(dir);
        evaluateTabVisibility();
        resetLayout();
      },

      handleDirectionKeyPress = function(evt) {
        var dir = keyMap[evt.keyCode];
        if (dir) {
          handleShiftingEvent(dir);
        }
      },

      applyBehaviors = function() {
        _.each(_.keys(tabs), function(dir) {
          tabs[dir] = getNavig(layout.getCurrent()).find("." + dir).first();
          tabs[dir].on("click", function() {
            handleShiftingEvent(dir);
          });
        });
      },

      resetLayout = function() {
        state.applyLayout();

        if (prevNavig) {
          prevNavig.remove();
        }

        cont.prepend(cachedTemplates[layout.getCurrent()](getModel()));
        prevNavig = getNavig(layout.getCurrent());

        applyBehaviors();
        evaluateTabVisibility();
      },

      reset = function(newConfig, newData) {
        currentConfig = newConfig || initialConfig;
        data = newData || data;

        panToStart();

        $(document).off("keyup"); //conditional?
        $(document).on("keyup", handleDirectionKeyPress);

        resetLayout();

      },

      resetState = function() {
          state.changeWindowWidth(layout.isMobile() ? 1:3);
      };

    return {
      reset: reset,
      resize: reset,
      type: globals.nav
    };
  };


  var stateSupport = function(full, initialWindowWidth, step) {

    var cursor = 0,
      used = false,
      windowWidth = initialWindowWidth,

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

      back = function() {
        if (!depleted()) {
          cursor -= 1;
        }
        return compensate();
      },

      forward = function() {
        if (!maxed()) {
          cursor += 1;
        }
        return compensate();
      },

      last = function() {
        cursor = full - (windowWidth * step);
        return compensate();
      },

      first = function() {
        cursor = 0;
        return compensate();
      },

      current = function() {
        return used ? compensate() : last();
      },

      applyLayout = function() {
        windowWidth = layout.isMobile() ? 1:initialWindowWidth;
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

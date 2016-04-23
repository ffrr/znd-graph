define("znd-graph-core", ["znd-graph-pie", "znd-graph-bar", "znd-graph-timeline", "util"],

  function(pie, bar, timeline, util) {
    "use strict";

    var resizable = {
      resize: function(newConfig) {
        this.reset(null, newConfig);
      }
    };

    var export_ = {
      bar: bar,
      timeline: timeline,
      pie: pie
    };

    _.each(export_, function(module, name) {
      export_[name] = util.mixin(module, resizable);
    });

    return export_;

  });

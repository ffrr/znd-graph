"use strict";
require.config({
  // make components more sensible
  // expose jquery
  paths: {
    "components": "../bower_components",
    "jquery": "../bower_components/jquery/dist/jquery",
    "d3": "../bower_components/d3/d3",
    "d3-tip": "../bower_components/d3-tip/index",
    "lodash": "../bower_components/lodash/lodash",
    "domready": "../bower_components/domready/ready"
  },
  urlArgs: "bust=" + (new Date()).getTime()
});


require(['znd-graph-init'], function(){});

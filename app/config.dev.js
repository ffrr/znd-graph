"use strict";


var basePath = function(path) {
  return "../bower_components/" + path;
},
applyToValues = function(obj, method) {
  var newObj = {};
  Object.keys(obj).forEach(function(k) {
    newObj[k] =  method(obj[k]);
  })
  return newObj;
};

require.config({
  // make components more sensible
  // expose jquery

  paths: applyToValues({
    "jquery": "jquery/dist/jquery",
    "d3": "d3/d3",
    "d3-tip": "d3-tip/index",
    "lodash_preinit": "lodash/lodash",
    "domready": "domready/ready"
  }, basePath),
  urlArgs: "bust=" + (new Date()).getTime()
});


// can't get shimming to work properly
define("lodash", ["lodash_preinit"], function(_) {
  _.templateSettings = {
    interpolate: /<@=([\s\S]+?)@>/g,
    evaluate: /<@([\s\S]+?)@>/g
  };
  return _;
});

require(['znd-graph-init'], function(){});

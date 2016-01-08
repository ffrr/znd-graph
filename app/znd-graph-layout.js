define("znd-graph-layout", ["util", "lodash", "znd-graph-config"], function(util, _, globals) {

	var widthMap = [[768, globals.layout.MOBILE ], [Number.POSITIVE_INFINITY, globals.layout.DESKTOP]],

	container, definitions,

	enable = function(container_, definitions_) {
		container = container_, definitions = definitions_,

	    $(window).resize(util.onResizeEnd(function() {
	    	handleResize();
	    }));
	}, 

	chartHandler = function(definition) {
		definition.config.width = container.width(); 
		definition.config.layout = currentLayout;
		definition.component.resize(definition.config);
	},

	navHandler = function(definition) {

	},

	handleResize = function() {

    	var currentLayout = _.find(widthMap, function(layout) {
    		return container.width() < layout[0];
    	})[1];


    	_.forEach(definitions, function(definition) {
    		//navhandler
    		//charthandler
    	});

    	// returns the first applicaple layout function and runs it
	};

	return {
		enable: enable,
		start: handleResize,
		handlers: {
			chart: chartHandler,
			nav: navHandler
		}
	};

});
define("znd-graph-layout", ["util", "lodash"], function(util, _) {

	var applyDesktopLayout = function(definitions) {

	}, 
		applyMobileLayout = function(definitions) {

	}, widths = [[768, applyMobileLayout], [Number.POSITIVE_INFINITY, applyDesktopLayout]],

	enable = function(container, definitions) {

	    $(window).resize(util.onResizeEnd(function() {
	    	handleResize(container, definitions);
	    }));

	}, handleResize = function(container, definitions) {
    	
    	_.forEach(definitions, function(definition) { 		
    		config.width = container.width(); 
    		definition.chart.reset(null, definition.config);
    	});

    	// returns the first applicaple layout function and runs it
    	_.find(widths, function(layout) {
    		return container.width() < layout[0];
    	})[1](pairs);
	};

	return {
		enable: enable
	};

});
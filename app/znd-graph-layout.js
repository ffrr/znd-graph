define("znd-graph-layout", ["util", "lodash"], function(util, _) {

	var applyDesktopLayout = function(pairs) {

	}, 
		applyMobileLayout = function(pairs) {

	}, widths = [[768, applyMobileLayout], [Number.POSITIVE_INFINITY, applyDesktopLayout]],

	enable = function(container, pairs) {

	    $(window).resize(util.onResizeEnd(function() {
	    	handleResize(container, pairs);
	    }));

	}, handleResize = function(container, pairs) {
    	
    	_.forEach(pairs, function(pair) { 
    		var graph = pair[0], config = pair[1];    		
    		config.width = container.width(); 
    		graph.reset(null, config);
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
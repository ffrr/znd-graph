define("znd-graph-layout", ["util", "lodash", "znd-graph-config"], function(util, _, globals) {

	var widthMap = [[768, globals.layout.MOBILE ], [Number.POSITIVE_INFINITY, globals.layout.DESKTOP]],

	container, definitions, export_, currentLayout,

	enable = function(container_, definitions_) {
		container = container_, definitions = definitions_;

		reloadLayout();

	    $(window).resize(util.onResizeEnd(function() {
	    	handleResize();
	    }));
	}, 

	handleResize = function() {
		reloadLayout();
    	widthDefinition = { width: $(container).width() };

    	_.forEach(definitions, function(d) {
			d.component.resize(_.extend(d.config, widthDefinition));
    	});
	},

	reloadLayout = function() {
		currentLayout = _.find(widthMap, function(layout) {
    		return $(container).width() < layout[0];
    	})[1]
	},

	getCurrent = function() {
		return currentLayout;
	},

    isDesktop = function() {
        return currentLayout == globals.layout.DESKTOP;
    },

    isMobile = function() {
        return currentLayout == globals.layout.MOBILE;
    };

	export_ = {
		enable: enable,
		start: handleResize,
		isDesktop: isDesktop,
		isMobile: isMobile,
		getCurrent: getCurrent
	};

	return export_;

});
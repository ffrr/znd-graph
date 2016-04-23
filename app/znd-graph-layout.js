define("znd-graph-layout", ["util", "lodash", "znd-graph-config", "jquery"], function(util, _, globals, $) {

	var container, definitions, export_, currentLayout, prevLayout,
    widthMap;

	reloadLayout = function() {
		currentLayout = _.find(widthMap, function(layout) {
    		return $(container).width() < layout[0];
    	})[1];
	},

  isMobile = function() {
      return currentLayout === globals.layout.MOBILE;
  },

	handleResize = function() {
		reloadLayout();

    var widthDefinition = { width: $(container).width() };

  	if(isMobile() && prevLayout === currentLayout) {
  		return;
  	}

  	_.forEach(definitions, function(d) {
		d.component.resize(_.extend(d.config, widthDefinition));
  	});
	},

	enable = function(container_, definitions_) {
		container = container_; definitions = definitions_;
    widthMap = [[768 - 40, globals.layout.MOBILE ], [Number.POSITIVE_INFINITY, globals.layout.DESKTOP]],
		reloadLayout();

	    $(window).resize(
	    	_.debounce(function() {
	    		handleResize();
	    		prevLayout = currentLayout;
	    	}, 200)
    	);
	},




	getCurrent = function() {
		return currentLayout;
	},

  isDesktop = function() {
        return currentLayout === globals.layout.DESKTOP;
    },


  hideHandler = function(el, handler) {
		el.style("visibility", export_[handler]() ? "hidden":"visible");
	},

	// SRP broken here
  hideOnMobile = function(el) {
  	hideHandler(el, "isMobile");
  },

  hideOnDesktop = function(el) {
  	hideHandler(el, "isDesktop");
  };

	export_ = {
		enable: enable,
		start: handleResize,
		isDesktop: isDesktop,
		isMobile: isMobile,
		getCurrent: getCurrent,
		hideOnMobile: hideOnMobile,
		hideOnDesktop: hideOnDesktop
	};

	return export_;

});

define("znd-graph-layout", ["util", "lodash", "znd-graph-config", "jquery"], function(util, _, globals, $) {

	var container, definitions, export_, currentLayout, prevLayout,
    widthMap, storedWidth;

	reloadLayout = function(detectedWidth) {
		var detectedWidth = detectedWidth || window.innerWidth;
		currentLayout = _.find(widthMap, function(layout) {
    		return detectedWidth < layout[0];
    	})[1];
	},

  isMobile = function() {
      return currentLayout === globals.layout.MOBILE;
  },

	triggerResizeForComponent = _.curry(function(width, d) {
		var newConf = _.extend(d.config, { width: width});
		d.component.resize(newConf);
	}),

	handleResize = function() {
		var detectedWindowWidth = window.innerWidth, detectedContainerWidth = $(container).width();

		if(storedWidth === detectedContainerWidth) {
			return;
		}

		storedWidth = detectedContainerWidth;
		reloadLayout(detectedWindowWidth);

  	// if(isMobile() && prevLayout === currentLayout) {
  	// 	return;
  	// }

		if(isDesktop()) {
			triggerResizeForComponent(detectedContainerWidth, definitions.bar);
		}
		
  	_.forEach(definitions, triggerResizeForComponent($(container).width()));
	},



	enable = function(container_, definitions_) {
		container = container_; definitions = definitions_;
    widthMap = [[768, globals.layout.MOBILE ], [Number.POSITIVE_INFINITY, globals.layout.DESKTOP]],
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

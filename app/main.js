define(["lodash", "c3", "d3", "jquery", "d3-tip"], function(_, c3, d3, $) {
	"use strict";
	console.log($);

	var /* color = d3.scale.category20(), */
		color = d3.scale.ordinal().range(_.map([
			"00d4ff", "ff92d7", "ffc900", "00c367", "ada9ff", "fff300",
			"ff4dd8", "007cff", "ff8600", "00acd5", "ff4d00", "00d21d",
			"b97aff", "00deb9", "c7344f"
		], function(s) { return d3.rgb("#" + s); })), 
		yearStart = function(year) { return new Date(year, 0, 1); },
		yearMid = function(year) { return new Date(year, 6, 1); },
		yearEnd = function(year) { return new Date(year, 11, 31); },
		sum = function(sum, curr) { return (sum || 0) + curr },		
		onResizeEnd = (function(callback) {
			var resizeId;
			return function(evt) {
				clearTimeout(resizeId);
    			resizeId = setTimeout(callback, 350, evt);
			};
		});
	
	var scaleFor = function(scale) { return function(d) { return scale.call(window, d); }};


	var applyMargins = function(config, base) {
      	var g = base.append("g")
      		.attr("transform", "translate(" + (config.margin.left) + "," + (config.margin.top) + ")")
      	return g;

	},  applySizing = function(config, base) {
		base.attr("width", config.width + config.margin.left + config.margin.right)
      		.attr("height", config.height + config.margin.top + config.margin.bottom);

      	return applyMargins(config, base);
    }, 	inner = function(base) {
			return base.append("g");
	};

	var randomId = function() { return "" + Math.round(Math.random() * 1e6) + "-" + (new Date().getTime() + "").slice(6); };


	var parseTransform = function(a) {
    	var b={};
    	for (var i in a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?\s?)+\))+/g)) { 
    		var c = a[i].match(/[\w\.\-]+/g);
        	b[c.shift()] = c;
    	}
    	return b;
	}

	var paddedTimeScale = function(width, data) {
			var ret = d3.time.scale()
					.domain([_.first(data.x), yearStart( _.last(data.x).getFullYear() + 1)])
					.range([0, width]);
			return ret;
		};

	var timeAxis = function(parent, renderSums) {
		var data, scale, pos, suffix;

		var mainAxis = d3.svg.axis().orient("bottom").ticks(d3.time.year, 1),
			subAxis = d3.svg.axis().orient("bottom").ticks(d3.time.year, 1)
	 			.tickFormat(function(d, index) {
		 			return _.reduce(data.y[index],sum) + suffix;
	 		}), 

 			textPadding = { top: 40 };

 		var container = parent.append("g").attr("class", "axis-x"),
			mainAxisEl = container.append("g").attr("class", "axis-x-main"), 
			subAxisEl;
		
		if(renderSums) {
			subAxisEl = container.append("g").attr("class", "axis-x-support");
		}


		var reset = function(newData, newScale, newPos, newSuffix) {
				data = newData; scale = newScale; pos = newPos; suffix = newSuffix;
				initialize();
			},

			initialize = function() {
				mainAxis.scale(scale); subAxis.scale(scale);
				render();
			},

			renderPartialAxis = function(axis, axisEl, y) {
				
				axisEl.call(axis);

				axisEl.selectAll("text")
					.style("text-anchor", "middle")
					.attr("y",  y);

				//axisEl.transition().style("opacity", 1);
			},

			height = function() {
				return textPadding.top + (subAxisEl ? 30:50);
			},

			render = function() {

				container.transition().attr("transform", "translate(" + pos.x + ", " + pos.y + ")");
				
				renderPartialAxis(mainAxis, mainAxisEl, textPadding.top);

				if(subAxisEl) {
					renderPartialAxis(subAxis, subAxisEl, textPadding.top + 20);					
				}
			};
			

		return {
			reset: reset,
			container: container,
			textPadding: textPadding,
			height: height
		};
	};




	var data = {
		companies: ["Plastika Nitra", "Prvá tunelárska"],
		volumesByYear: [
		{ date: yearStart(2005), values: [50, 10] },
		{ date: yearStart(2006), values: [30, 20] },
		{ date: yearStart(2007), values: [20, 10] },
		{ date: yearStart(2008), values: [50, 20] },
		{ date: yearStart(2009), values: [20, 15] },
		{ date: yearStart(2010), values: [60, 13] },
	]};


	var grid = function(base) {
		var _export, width, height, horzScale, vertScale, axes = { horizontal: false, vertical: false }, tickAmount;

		var reset = function(newConfig) {
			width = newConfig.width;
			height = newConfig.height;
			tickAmount = newConfig.tickAmount;

			var here = this;
			
			_.each(axes, function(key, value) {
				if(key) eval(value + "()");
			});
		},

		horz = function(scale) {
			horzScale = scale;
			axes.horizontal = true;
			return _export;
		},

		vert = function(scale) {
			vertScale = scale;
			axes.vertical = true;
			return _export;
		},
		
		//private


		lines = _.curry(function(attr, klass, scale, ticks) {
			var lines = base.selectAll("." + klass).data(ticks);
			lines.exit().remove();
			lines.enter().append("line").attr("class", klass);

		    lines.transition().attr(attr);	 
		}),

		clampedTicks = function(scale) {
			var ticks = scale.ticks(tickAmount);
			ticks.push(scale.domain()[1]);
			return ticks;
		},

		horizontal = function() { 
			return lines({ "x1" : 0, "x2" : width,
            	"y1" : scaleFor(horzScale),
            	"y2" : scaleFor(horzScale)
        	}, "horz", horzScale)(clampedTicks(horzScale));
        },

        vertical = function() {
        	return lines({ "y1" : 0, "y2" : height,
            	"x1" : scaleFor(vertScale),
            	"x2" : scaleFor(vertScale),
        	}, "vert", vertScale)(vertScale.ticks(d3.time.year, 1));
        },

		_export = {
			horz: horz,
			vert: vert,
			reset: reset
		};

		return _export;
	};


	var tooltips = function(base, renderer, direction, offset, defaultListeners) {
		var tip = d3.tip()
			.attr("class", "d3-tip")
			.attr("id", randomId())
			.offset(offset || [0,0])
			.direction(direction || "n")
			.html(renderer),
			applyDefaultListeners = defaultListeners != null ? defaultListeners:true;

		console.log(defaultListeners, applyDefaultListeners);


	  	var toggle = _.curry(function(state, d) {
			tip[state ? "show":"hide"](d, this);
	 	});

	 	base.call(tip);

	 	var reset = function(selection) {
	 		if(applyDefaultListeners) {
		 		selection
		 			.on("mouseover", toggle(true))
		 			.on("mouseout", toggle(false))
 			}
	 	}, id = function() { return tip.attr("id"); }

	 	return {
	 		reset: reset,
	 		id: id,
	 		tip: tip
	 	};

	};

	var positionalUtils = {
			
		extendedMargin: function(margin, shift) {
			return _.assign(_.clone(margin), { left: margin.left + shift/2 });
		},

		remargin: function(el, margin) {
			el.transition().attr("transform", "translate(" + (margin.left) + "," + (margin.top) + ")")
		},

		pan: function(el, margin, distance) {
			el.transition().attr("transform", "translate(" + (distance) + "," + 0 + ")")	
		},

		resize: function(el, size, margin) {
			el.transition().attr("width", size.width + margin.left + margin.right)
  			.attr("height", size.height + margin.top + margin.bottom);
		},

		innerClip: function(el, size, margin) {
			el.transition().attr("width", size.width)
  				.attr("height", size.height - margin.bottom)
  				.attr("x", margin.left)
  				.attr("y", margin.top);
		}	
	};


	var navigationWidget = function(config, graphs) {
		var cont = config.container,
			left = config.left,
			right = config.right,

			toggle = function(element, t) {
				element.style("visibility", t ? "visible":"hidden");
			},
			evaluateVisibility = function() {
				toggle(left, !graph.depleted());
				toggle(right, !graph.maxed());
			};

		left.on("click", function() { _.each(graphs, function(g) { g.left(); }); });
		right.on("click", function() { _.each(graphs, function(g) { g.right(); }); });

	};


	var navigationFn = function(full, windowWidth, step) {

		var cursor = 0, used = false, windowWidth = (windowWidth != null || windowWidth != undefined) ? windowWidth:3, 
			
			back = function() {
				if(!depleted())  {
					cursor -= 1;
				}
				return compensate();
			},

			forward = function() {
				if(!maxed()) {
					cursor  += 1;
				}
				return compensate();
			},

			current = function() {
				return used ? compensate():last();
			},

			first = function() {
				cursor = 0;
				return compensate();
			},

			last = function() {
				cursor = full - (windowWidth * step);
				return compensate();
			},

			// 0, 2 -> 2, 4 -> step: 2, windowWidth: 2 (cursor * step, cursor * step + windowWidth)
			// 0, 2 -> 1, 3 -> step: 1, windowWidth: 2


			compensate = function() {
				used = true;
				return Math.min(full, cursor * step);
			},

			depleted = function() {
				return cursor === 0;
			},

			maxed = function() {
				var outerRange = cursor * step + windowWidth;
				return outerRange >= full; //(cursor + 1) === (Math.floor(full / (cursor * step)) + Math.ceil((full % step) / step));
			};

		return {
			back: back,
			forward: forward,
			first: first,
			last: last,
			current: current
		};
	};


	var window_ = function(data, range) {
		return {
			series: data.series,
			x: Array.prototype.slice.apply(data.x, range),
			y: Array.prototype.slice.apply(data.y, range),
		};
	};

	// var barGraphTooltip = function(d) {

	// };


	var barGraph = function(config, data, color, tooltipRenderer, gridRenderer, pos, nav) {
		//variables
		var me = {}, dir,
			columnWidth, margin, dataWindow, barWidth, extendedMargin, start, end, max, amountTickSuffix, innerWidth, innerHeight,
			stackedData, export_, navig, incSegments, currentPan;

		var id = randomId();

		//constants
		var xAxisPadding = 100, yTicks = 4, axisTextPadding = { left: 10, top: 15 };

		// var stackingMapperFactory = function(data) {
		// 	return function(series, seriesIndex) { 
		// 		return { 
		// 			series: series, 
		// 			values: data.y.map(function(item, innerIndex) { 
		// 				return { 
		// 					x: data.x[innerIndex],
		// 					y: item[seriesIndex]
		// 				};
		// 			}) 
		// 		};
		// 	};
		// };

		var stackedBarData = function(data) {
			return function(item, i) {
				var y0 = 0, obj = {};

				obj.x = data.x[i]; 				
				obj.y = _.map(color.domain(), function(series, j) {
					return {
						series: series,
						amount: item[j],
						y0: y0, 
						y1: y0 += item[j]
					}
				});

				return obj;
			}
		};


		//scales and data elements 
		var timeScale = d3.time.scale(),
			amountScale = d3.scale.linear(),
			amountAxis = d3.svg.axis()
	 			.orient("right")
	 			.ticks(yTicks)
	 			.tickFormat(function(d) {
	 				return d + amountTickSuffix;
	 			}),
			area = d3.svg.area()
	    		.x(function(d) { return timeScale(d.x); })
	    		.y0(function(d) { return amountScale(d.y0); })
	    		.y1(function(d) { return amountScale(d.y0 + d.y); }),
	    	flatArea = d3.svg.area()
	    		.x(function(d) { return timeScale(d.x); })
				.y0(function() { return amountScale(0); })			
				.y1(function() { return amountScale(0); }),
			stack = d3.layout.stack()
				.values(function(d) { return d.values; });



		//elements
		var	canvas = config.container.append("svg").attr("class", "canvas-area"),			
			clip = canvas.append("clipPath").attr("id", "clip-"+ id).append("rect"),
			content = canvas.append("g"),
			grid = inner(content),
			graph = inner(content), 
			legend = inner(canvas), 

			title = legend.append("text").attr("class", "heading")
				.attr("text-anchor", "middle")
				.text("Úspešnosť firmy v tendroch za jednotlivé roky"),

			leftAxis = legend.append("g").attr("class", "axis-y axis-left"),
			rightAxis = legend.append("g").attr("class", "axis-y axis-right"),
			bottomAxis = timeAxis(graph, true),

			tooltips = tooltipRenderer(graph, function(d, element) {
				var bullet = "<span class=\"bullet\" style=\"color: <%= color %>\"><span>&#8226;</span></span>",
	    			company = "<em class=\"company\"><%= company %></em>",
	    			amount = "<span class=\"amount\"><%= amount %></span>",
	    			item = _.template(["<li>", bullet, company, amount, "</li>"].join("")),
	    			list = _.template("<ul><% _.each(model, function(itemData) {%> <%= item(itemData) %> <% }); %></ul>"),
		    		model = _.map(d.y, function(item) {
		    			return {
		    				color: color(item.series),
		    				company: item.series,
		    				amount: item.amount + config.amountTickSuffix
		    			}
		    		});

	    		return list({ model: model, item: item });
			}, function(d) {
				if(d.x == start) return "e";
				return "w";
			}, function(d) {
				if(d.x == start) return [0, 10];
				return [0, -10];
			});
			
		canvas.attr("clip-path", "url(#clip-"+ id +")");

		var reset = function(/* newData, newConfig */) {			
			config = arguments[1] || config;
			data = arguments[0] || data;
			initDefaults();
			dataWindow = window_(data, [0, config.segments]);
			initialize();
		},

		initDefaults = function() {
		 	_.defaults(config, {
		 		padding: {},
		 		margin: {},
 				segments: 7,
				amountTickSuffix: " mil €"
		 	});

		 	_.defaults(config.padding, {
		 		top: 0, bottom: 0
		 	});

		 	_.defaults(config.margin, {
		 		 left: 0, top: 20, bottom: 0, right: 0,
	 		});
		},

		// direction = function(dir_) {
		// 	dir = dir_ != null || dir_ != undefined ? dir_:1;
		// 	return export_;
		// },

		left = function() {
			pan(navig.back());
		},

		right = function() {
			pan(navig.forward());
		},

		pan = function(position) {
			var compensation = position > 0 ? columnWidth * 0.5:0;
			pos.pan(content, extendedMargin, - (position * columnWidth + compensation));
			currentPan = position;
		},

		//private
		
		initialize = function() {
			columnWidth = config.width / (config.segments - 0.5);
			barWidth = columnWidth / 4;
			innerWidth = config.width - columnWidth; 
			outerWidth = columnWidth * (data.x.length - 1);
			innerHeight = config.height - (xAxisPadding);

			navig = nav(data.x.length, config.segments, 1);

			start = _.first(data.x); 
			end = _.last(data.x);

			max = config.max, //_.max(_.map(data.y, function(item) { return _.reduce(item, sum)})) * 1.6;
			amountTickSuffix = config.amountTickSuffix;

			timeScale.domain([start, end]).range([0, outerWidth]);
			amountScale.domain([0, max]).range([innerHeight, 0]);

			margin = config.margin;
			extendedMargin = pos.extendedMargin(margin, columnWidth);

			sizing();

			color.domain(data.series);
			//stackedData = stack(color.domain().map(stackingMapperFactory(data)));
			
			stackedData = _.map(data.y, stackedBarData(data));

			renderGrid();
			//renderArea();
			renderBars();
			repositionTooltips();
			
			//renderPointGroups();
			renderYAxes();
			renderXAxis();
			
			pan(currentPan !== null && currentPan !== undefined ? currentPan:navig.last());
		},

		renderGrid = function() {
			gridRenderer(grid)
				.horz(amountScale)
				.vert(paddedTimeScale(columnWidth * data.x.length, data))
				.reset({
					width: columnWidth * data.x.length,
					height: config.height + xAxisPadding,
					tickAmount: yTicks
			});
		},

		// renderArea = function() {
		// 	var series = graph.selectAll(".series")				
		//       	.data(stackedData);

		//     series.enter()
		//     	.append("path").attr("class", "series")
		//     	.attr("d", function(d) { return flatArea(d.values); })
		//     	.style("fill", function(d) { return color(d.series); })
		//     	.style("opacity", 0);
		    	
		//     series.transition().style("opacity", 1).attr("d", function(d) { return area(d.values); })
		    
		//     series.exit().transition().style("opacity", 0).remove();
		// },

		renderBars = function() {
						
			// var current = graph.selectAll(".segment");
			// 	current.remove();
			
			var bars = graph.selectAll(".segment").data(stackedData);

			//bars.exit().transition().attr("transform", function(d) { return "translate(" + (timeScale(d.x) - 100) + ",0)"; }).remove();      		


  			bars.enter().append("g").attr("class", "segment");

  			bars.transition().attr("transform", function(d) { return "translate(" + (timeScale(d.x)) + ",0)"; });
  				//.attr("x", function(d) { return timeScale(d.x); }).attr("y", 0);

  			var bands = bars.selectAll("rect").data(function(d) { return d.y; });
      		
      		bands.enter().append("rect")
    //  			.attr("height", 0)
 			
				// .style("opacity", 0)	
      			.style("fill", function(d) { return color(d.series); });

      		//var bt = bars.transition().duration(300).attr("transform", function(d) { return "translate(" + timeScale(d.x) + ",0)"; });	

      		bands.transition()
      			.style("opacity", 1)
      			.attr("width", barWidth)
      			.attr("y", function(d) { return amountScale(d.y1); })
      			.attr("x", -barWidth/2)      			
      			.attr("height", function(d) { return amountScale(d.y0) - amountScale(d.y1); });
      			//.attr("y", function(d) { return amountScale(d.y1); });
		},

		renderPointGroups = function() {
	    	var pointGroups = graph.selectAll(".points")
	    		.data(stackedData);

	    	pointGroups.exit().remove();

	    	pointGroups.enter().append("g").attr("class", "points")
				.each(renderPointsForGroup);
		},

		renderPointsForGroup = function(d) {  
			var group = d3.select(this), 
				points = group.selectAll("circle.point").data(function(d) {
	    			return d.values;
	    		}); 

			points.exit().remove();

    		points.enter().append("circle")
    			//enrich the current datum on iteration
    			.datum(function(pointDatum) { pointDatum.series = d.series; return pointDatum; })
	   			.attr("class", "point")
	   			.attr("cx", function(d) { return timeScale(d.x); })
	   			.attr("cy", function(d) { return amountScale(d.y0 + d.y); })
	   			.attr("r", 3)
	   			.style("opacity", 0)
	   			.attr("fill", color(group.data()[0].series));
	    },

	    renderYAxes = function() {
			amountAxis.scale(amountScale);
			
	 		rightAxis
	 			.call(amountAxis)	 		
		    	//.style("opacity", 0)
		    	.attr("transform", "translate(" + (innerWidth + columnWidth/2 - config.margin.right) + ",0)")		    
		  		.selectAll("text")
		    	.attr("x", - axisTextPadding.left)
		    	.attr("y", axisTextPadding.top)
		    	.style("text-anchor", "end");

		    //rightAxis.transition().style("opacity", 1);
	 		
	 		leftAxis		    	
		    	.call(amountAxis)
		    	.attr("transform", "translate(0,0)")
		    	//.style("opacity", 0)
		  		.selectAll("text")
		    	.attr("x", -columnWidth/2 + axisTextPadding.left)
		    	.attr("y", axisTextPadding.top)
		    	.style("text-anchor", "start");	

    		//leftAxis.transition().style("opacity", 1);
	    },

	    renderXAxis = function() {
	    	bottomAxis.reset(data, timeScale, {x: 0, y: innerHeight}, amountTickSuffix);
	    },

		sizing = function() {
			pos.resize(canvas, config, margin);
			pos.innerClip(clip, config, margin);
			//resize(overlay, config, margin);
			
			pos.remargin(grid, margin);
			//pos.remargin(clip, margin);
			pos.remargin(graph, extendedMargin);
			pos.remargin(legend, extendedMargin);

			repositionTitle();
		},

		repositionTooltips = function() {
			tooltips.reset(graph.selectAll(".segment"));
		},


		repositionTitle = function() {
			title.transition().attr("x", innerWidth / 2).attr("y", 40)
		};
		
		export_ = {
			reset: reset,
			left: left,
			right: right
		};

		return export_;

	};

	var timeline = function(config, data, color, tooltipRenderer, gridRenderer, pos, nav) {
	 	var config, data, start, end, columnWidth, innerHeight,  dataWindow, positionalSeries, rangedSeries, contentMask, axisMask, navig,
	 		innerY, currentPan, titleHeight = 18, titleToTimelinePadding = 20, axisTextPadding = { left: 10, top: 15 };

	 	//init defaults

		var id = randomId();

	 	var timeScale = d3.time.scale(),
		 	positionScale = d3.scale.ordinal();

	 	var rangeKey = function(item) { return item.series + item.position; },
	 		verticalPosition = function(d) { return positionScale(rangeKey(d)) + 5; },
	 		textPosition = function(d) { return d.position };

	 	var canvas = config.container.append("svg").attr("class", "canvas-timeline"),
			clip = canvas.append("clipPath").attr("id", "clip-"+ id).append("rect"),
			content = inner(canvas),
	 		grid = inner(content),
	 		timeline = inner(content),
		 	legend = inner(canvas),
		 	
		 	leftAxis = legend.append("g").attr("class", "labelgroup-left"),
		 	rightAxis = legend.append("g").attr("class", "labelgroup-right"),

		 	title = legend.append("text").attr("class", "heading")
				.attr("text-anchor", "middle")
				.text("Účinkovanie osoby vo firmách"),

			bottomAxis = timeAxis(timeline, false);

		canvas.attr("clip-path", "url(#clip-"+ id +")")

		var reset = function(/* newData, newConfig */) {
			data = arguments[0] || data;
			config = arguments[1] || config;
			initDefaults();
			dataWindow = window_(data, [0, config.segments]);
			initialize();
		},

		initDefaults = function() {

		 	_.defaults(config, {
		 		padding: {},
		 		margin: {},
		 		itemHeight: 35,
 				segments: 7,
				tipCompensation: 4,
				labelPadding: 15
		 	});

		 	_.defaults(config.padding, {
		 		top: 30, bottom: 0
		 	});

		 	_.defaults(config.margin, {
		 		 left: 0, top: 0, right: 0, bottom: 0
	 		});
		},

		left = function() {
			pan(navig.back());
		},

		right = function() {
			pan(navig.forward());
		},

		pan = function(position) {
			var compensation = position > 0 ? columnWidth * 0.5:0;
			pos.pan(content, config.margin, - (position * columnWidth + compensation));
			currentPan = position;
		},

		initialize = function() {
			columnWidth = config.width / (config.segments - 0.5);
			start = _.first(data.x); end = _.last(data.x);
			outerWidth = columnWidth * (data.x.length - 1);			
			
			navig = nav(data.x.length, config.segments, 1);

			denormalizeSeries();
			computeHeight();

			timeScale
				.domain([start, end]) //yearEnd(end.getFullYear())
				.range([0, outerWidth]);
			
			positionScale
				.domain(positionalSeries.map(rangeKey))
				.rangePoints([ innerY, innerHeight + innerY ])

			color.domain(data.series);

			//renderMasks();
			renderTimeline();
			renderGrid();
			renderXAxis();
			renderYAxes();
			renderCirclePointer();

			repositionTooltips();

			sizing();
			pan(currentPan !== null && currentPan !== undefined ? currentPan:navig.last());
		},



		denormalizeSeries = function() {

			//denormalize series by position
			positionalSeries = _.flatten(data.timeline.map(function(item, seriesIndex) {
				return item.map(function(segment) { 
					//inject series name into the position object
					return _.assign(segment, { series: data.series[seriesIndex] }); });
			}));

			//denormalize series by range 
			rangedSeries = _.flatten(positionalSeries.map(function(item) {
				// inject data to range object
				return item.ranges.map(function(range) { return { from: range[0], to: range[1], series: item.series, position: item.position }; });
			}));
		},

		computeHeight = function() {
			var p = config.padding;
			innerHeight = positionalSeries.length * config.itemHeight; 
			innerY = config.padding.top + titleHeight + titleToTimelinePadding;
			config.height = innerY + innerHeight + p.bottom + bottomAxis.height();
			
		},

	    renderXAxis = function() {
	    	bottomAxis.reset(data, timeScale, { x: columnWidth/2, y: config.height - bottomAxis.height() }, null);
	    },

	    renderYAxes = function() {
			leftAxis.attr("transform", "translate(" + axisTextPadding.left + ",-" + config.labelPadding + ")");
			rightAxis.attr("transform", "translate(" + (config.width - axisTextPadding.left) + ",-" + config.labelPadding + ")");
		    
	    	renderLegendAxis(leftAxis); renderLegendAxis(rightAxis); 
	    },

	    renderBackgroundBars = function(container) {
	    	var bars = container.selectAll(".bar-bg").data(positionalSeries);
	    		    	
	    	bars.exit().remove();

			bars.enter().append("line");
				//.attr("class", "bar-bg-cont")
				//.attr("transform", function(d) { return "translate(0, " + verticalPosition(d) + ")" });
			
			//added.append("line");				

		    bars.transition().attr({ "x1" : config.tipCompensation, "x2" : columnWidth * data.x.length - config.tipCompensation,
	            "y1" : verticalPosition,
	            "y2" : verticalPosition,
	            "class": "bar-bg"
	        });
	    },

	    renderOverlays = function(container) {			
			var overlays = container.selectAll(".bar-overlay").data(positionalSeries);

			overlays.exit().remove();
			overlays.enter().append("rect");

			overlays.attr("height", config.itemHeight + 4)
				.attr("width", columnWidth * data.x.length)
				.attr("y", function(d) { return verticalPosition(d) - config.itemHeight; })
				.attr("class", "bar-overlay")
				.attr("fill", "transparent");
	    },

	    renderTimeline = function() {

	    	renderBackgroundBars(timeline);
	    	var front = timeline.selectAll(".bar").data(rangedSeries);

		    front.exit().remove();

		    front.enter().append("line");
		    
		    front.transition().attr({ 
	        	"x1" : function(d) { 
	        		return timeScale(yearStart(d.from)) + config.tipCompensation; 
	        	}, 
	        	"x2" : function(d) { 
	        		return timeScale(yearEnd(d.to)) - config.tipCompensation; 
	        	},
	            "y1" : verticalPosition,
	            "y2" : verticalPosition,
	            "class": "bar"
	        }).style("stroke", function(d) { return color(d.series) });

	        renderOverlays(timeline);
	    },

	    renderCirclePointer = function() {
	    	var pointer = timeline.append("circle")
	    		.attr({"r": 4, "fill": "transparent", "stroke": "#FFF", "stroke-width": 2}),
				tooltipEl = $("#timelineTip"),
				containerEl = $(config.container[0][0]);

	    	timeline.selectAll(".bar-overlay").on("mousemove", function() {
	    		var currentShift = pointer[0][0].getCTM().e,
	    			currentDatum = d3.select(d3.event.srcElement).datum();

	    		pointer.attr({ "cx": d3.event.x - currentShift, "cy": verticalPosition(currentDatum) });	    		

	    		tooltipEl.css({
	    			left: d3.event.x - tooltipEl.width() / 2 - 6, 
	    			top: verticalPosition(currentDatum) + containerEl.offset().top - (tooltipEl.height() + 35)
	    		});
	    		tooltipEl.html("" + currentDatum.position + "<br/><br/>")
	    	});



	    	canvas.on("mouseover", function() {
				tooltipEl.show();
	    		pointer.style("visibility", "visible"); 
	    	});

	    	canvas.on("mouseout", function() {
	    		if(d3.event.toElement !== tooltipEl[0])  { //add parent detection
		    		tooltipEl.hide();
		    		pointer.style("visibility", "hidden"); 
	    		}
	    	});

	    },

		renderGrid = function() {
			gridRenderer(grid)
				.vert(paddedTimeScale(columnWidth * data.x.length, data))
				.reset({
					width: columnWidth * data.x.length,
					height: config.height
			});
		},

		renderLegendAxis = function(base, cssClass) {
			var boundBase = base.selectAll(".label").data(rangedSeries);
			
			boundBase.exit().remove();
			boundBase.enter().append("text").text(textPosition);

		   	boundBase.attr({"x": 0, "y": verticalPosition, "class": "label"});
		},
		
		sizing = function() {

			var margin = config.margin,
				shifted = pos.extendedMargin(margin, columnWidth);

			pos.resize(canvas, config, margin);
			pos.innerClip(clip, config, margin);

			pos.remargin(grid, margin);
			pos.remargin(timeline, margin);
			pos.remargin(legend, margin);

			repositionTitle();


			//sizeMasks();
		},

		sizeMasks = function() {
			var margin = config.margin,
				axis = bottomAxis.container,
				axisTransform = parseTransform(axis.attr("transform")),
				contentMaskMargin = { 
					top: margin.top, 
					left: margin.left + columnWidth / 2 - config.tipCompensation/2, 
					right: columnWidth - config.tipCompensation / 2, 
					bottom: 0
				};

			axisMask
				.attr("transform", "translate(" + 
					(config.margin.left) + ", " + 
					(parseInt(axisTransform.translate[1]) + bottomAxis.textPadding.top - 10) + ")" )
				.attr("width", config.width - config.margin.left - config.margin.right)
				.attr("height", bottomAxis.height());
			
			pos.innerClip(contentMask, config, contentMaskMargin);

			//pos.innerClip(axisMask, { width})
		},

		// renderMasks = function() {
		// 	contentMask = clip.append("rect");
		// 	axisMask = clip.append("rect");
		// },

		repositionTooltips = function() {
			//tooltips.reset(canvas);
		},

		repositionTitle = function() {
			title.transition().attr("x", config.width / 2).attr("y", config.padding.top)
		};

		return {
			reset: reset,
			left: left,
			right: right
		};


	};

	var createHorizontalBarChart = function(config, data) {

		var aggregate = _.zip.apply(null, data.y).map(function(arr) { //get the aggregated sum of each series
			return _.reduce(arr, sum);
		}),
			total = _.reduce(aggregate, sum);

		var barData = aggregate.map(function(item, index) {
			return { sum: item, series: data.series[index] }
		});

		barData.map(function(item, index) {
			return _.assign(item, { runningTotal: index > 0 ? (item.sum + barData[index - 1].runningTotal):item.sum, })
		});

		var xScale = d3.scale.linear()
			.domain([0, total])
			.range([0, config.width]);

		var barChart = applySizing(config, config.containers.panned.append("svg").attr("class", "canvas-barchart"));

		barChart.selectAll(".segment").data(barData).enter()
			.append("rect")
			.attr("x", function(d, index) { return xScale(d.runningTotal - d.sum); })
			.attr("width", function(d) { return xScale(d.sum); })
			.attr("height", config.height)
			.attr("y", 0)
			.attr("fill", function(d) { return color(d.series); });					

		createVerticalLines(_.assign(config, { left: 0, right: 0, top: 0}), barChart, xScale, 26);

		var axis = d3.svg.axis().scale(xScale).orient("bottom").tickFormat(function(d) {
	 			return d + config.amountTickSuffix;
 		}).tickValues([0, total]);

    	barChart.append("g").attr("class", "axis-x")
			.call(axis)
			.attr("transform", "translate(0, "+ config.height +")")
			.selectAll("text")
			.attr("y", 10)
			.style("text-anchor", function(d) { return d == 0 ? "start":"end"; });
	};


	////

	var points = { 
		series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
		x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,
		y: [[50, 10, 20], [0, 0, 0], [0, 0, 0], [50, 20, 28], [20, 15, 30], [150, 13, 50 ], [100, 60, 40]],
		timeline: [[
			{ position: "Štatutár", ranges: [[2005, 2008]] },
			{ position: "Zástupca riaditeľa", ranges: [[2008, 2009]] }
		],[
			{ position: "Štatutár", ranges: [[2005, 2007], [2009, 2010]] },
			{ position: "Zástupca riaditeľa", ranges: [[2005, 2008]] }
		],[
			{ position: "Kotolník", ranges: [[2005, 2011]] },
		]]
	}; 

	points.x = points.x.map(function(year) {
		return yearStart(year);
	});

	var points2 = { 
		series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
		x: [2006, 2007, 2008, 2009, 2010, 2011, 2012] ,
		y: [[60, 10, 40], [60, 10, 40], [20, 70, 15], [20, 15, 30], [150, 13, 50 ], [100, 60, 40], [30, 20, 10]],
		timeline: [[
			{ position: "Štatutár", ranges: [[2005, 2008]] },
			{ position: "Zástupca riaditeľa", ranges: [[2008, 2009]] }
		],[
			{ position: "Štatutár", ranges: [[2005, 2007], [2009, 2010]] },
			{ position: "Zástupca riaditeľa", ranges: [[2005, 2008]] }
		],[
			{ position: "Kotolník", ranges: [[2005, 2011]] },
		]]
	};


	points2.x = points2.x.map(function(year) {
		return yearStart(year);
	});

	var points3 = { 
		series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
		x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,
		y: [[50, 10], [60, 10], [20, 70], [50, 11], [20, 15], [150, 13], [10, 60]],
		timeline: [[
			{ position: "Štatutár", ranges: [[2005, 2008]] },
			{ position: "Zástupca riaditeľa", ranges: [[2008, 2009]] },
			{ position: "Niktoš", ranges: [[2008, 2009]] },
			{ position: "Výpalník", ranges: [[2008, 2009]] },
			{ position: "Honelník", ranges: [[2008, 2009]] },
			{ position: "Pohonič", ranges: [[2008, 2009]] },
			{ position: "Pohonič2", ranges: [[2008, 2009]] },
			{ position: "Pohonič3", ranges: [[2008, 2009]] },
		],[
			{ position: "Štatutár", ranges: [[2005, 2007], [2009, 2010]] },
			{ position: "Zástupca riaditeľa", ranges: [[2005, 2008]] }
		],[
			{ position: "Kotolník", ranges: [[2005, 2011]] },
		]]
	};

	points3.x = points3.x.map(function(year) {
		return yearStart(year);
	});

	// points.timeline = points.timeline.map(function(series) {
	// 	return series.map(function(position) { 
	// 		return _.assign(position, { ranges: 
	// 			position.ranges.map(function(range) { return [yearStart(range[0]), yearStart(range[1])]; }) });
	// 	});
	// });
	

	var gen = function(klass, selector) { return d3.select(selector).append("div").attr("class", klass); },
		containers = function(selector) { return { panned: gen("panned", selector), static: gen("static", selector)}; };

	var areaConfig = {
		width: $(window).width(), height: 400,
		segments: 5,
		container: d3.select("#area"),
		max: _.max(_.map(points.y, function(item) { return _.reduce(item, sum)})) * 1.6
	},  areaConfig2 = {
		width: 660, height: 400,
		container: d3.select("#area")
	};

	
	var timelineConfig = {
		width: areaConfig.width,
		segments: 5,
		itemHeight: 40,
		container: d3.select("#timeline")
	};

	
	var barChartConfig = {
		margin: _.assign(_.clone(areaConfig.margin), { top: 30, bottom: 40 }),
		width: areaConfig.width,
		height: 30,
		padding: { left: 0 },
		amountTickSuffix: areaConfig.amountTickSuffix,
		containers: containers("#bar")
	};


	var navConfig = {
		container: d3.select("#container"),
		left: d3.select(".pan.left"),
		right: d3.select(".pan.right")
	};


	var gr = barGraph(areaConfig, points/*window_(points, [0,4])*/, color, tooltips, grid, positionalUtils, navigationFn);
	gr.reset();
	

	var tm = timeline(timelineConfig, points3, color, tooltips, grid, positionalUtils, navigationFn);
	tm.reset();

	navigationWidget(navConfig, [gr, tm]);


	$(window).resize(onResizeEnd(function() {
		areaConfig.width = timelineConfig.width = $(window).width(),
		gr.reset(points, areaConfig);
		tm.reset(points3, timelineConfig);
	}));


	//console.log(window_(points, [0,1]));

	//_.delay(function() { gr.reset(areaConfig2, points3); }, 2000);
	//_.delay(function() { gr.reset(areaConfig, points); }, 4000);
	
	// createHorizontalBarChart(barChartConfig, points);
	
	// createbarGraph(config, points);

	// createTimeline(timelineConfig, points);


});
	
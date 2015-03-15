define(["lodash", "c3", "d3", "jquery", "d3-tip"], function(_, c3, d3, $) {

	var color = d3.scale.category20(), 
		yearStart = function(year) { return new Date(year, 0, 1); },
		yearMid = function(year) { return new Date(year, 6, 1); },
		yearEnd = function(year) { return new Date(year, 11, 31); },
		sum = function(sum, curr) { return (sum || 0) + curr };

	
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


	var paddedTimeScale = function(config, data) {			
			return d3.time.scale()
					.domain([_.first(data.x), yearStart( _.last(data.x).getFullYear() + 1)])
					.nice(d3.time.year)
					.range([0, config.width]);
		},

		createVerticalLines = function(config, container, scale) {
			container.selectAll("line.vert").data(scale.ticks(arguments[3])).enter()
			    .append("line")
			        .attr({ "y1" : 0, "y2" : config.height,
			            "x1" : scaleFor(scale),
			            "x2" : scaleFor(scale),
			            "class": "vert"
			        });	
		}, 

		createHorizontalLines = function(config, container, scale, tickAmount) {
			var ticks = scale.ticks(tickAmount);

			ticks.push(scale.domain()[1]); 

			container.selectAll("line.horz").data(ticks).enter()
			    .append("line")
			        .attr({ "x1" : 0, "x2" : config.width,
			            "y1" : scaleFor(scale),
			            "y2" : scaleFor(scale),
			            "class": "horz"
			        });	        			
		};

	var timeAxis = function(parent, renderSums) {
		var data, scale, pos, suffix;

		var mainAxis = d3.svg.axis().orient("bottom"),
			subAxis = d3.svg.axis().orient("bottom")
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
				
				axisEl.call(axis).style("opacity", 0)
					.selectAll("text")
					.attr("y",  y)
					.style("text-anchor", "middle");

				axisEl.transition().style("opacity", 1);
			},

			render = function() {

				container.attr("transform", "translate(" + pos.x + ", " + pos.y + ")");
				
				renderPartialAxis(mainAxis, mainAxisEl, textPadding.top);

				if(subAxisEl) {
					renderPartialAxis(subAxis, subAxisEl, textPadding.top + 20);					
				}
			};
			

		return {
			reset: reset
		};
	};


	var TimeAxis = function(config) {
		var me = this;

		_.assign(this, config);

		_.defaults(this, {
			timeAxis: d3.svg.axis().scale(this.scale).orient("bottom"),
			sumAxis: d3.svg.axis().scale(this.scale).orient("bottom")
	 			.tickFormat(function(d, index) {
		 			return me.data.y[index].reduce(sum) + me.suffix;
	 		}),
			renderSums: true,
	 		textPadding: { top: 40 }
		});		 		
		this.container = this.parent.append("g").attr("class", "axis-x");
	};

	TimeAxis.prototype.render = function(/* sumAxisEnabled */) {
		
    	this.container.append("g").attr("class", "axis-x-main")
	    		.call(this.timeAxis)
	  			.selectAll("text")
	    		.attr("y", this.textPadding.top)
	    		// .attr("x", 6)
	    		.style("text-anchor", "middle");
	    if(this.renderSums) {
		 	this.container.append("g")
		    	.attr("class", "axis-x-support")
		    	.call(this.sumAxis)
		  		.selectAll("text")
		    	.attr("y", this.textPadding.top + 20)
		    	.style("text-anchor", "middle");
	    }
    	return this;
	};

	TimeAxis.prototype.pos = function(/* x, y */) {
		this.container.attr("transform", "translate(" + (arguments[0] || 0) + ", " + (arguments[1] || 0) + ")")
		return this;
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
        	}, "vert", vertScale)(vertScale.ticks());
        },

		// horizontal = function() {
		// 	var ticks = horzScale.ticks(tickAmount);
		// 	ticks.push(horzScale.domain()[1]); 

		// 	var lines = base.selectAll("line.horz").data(ticks);

		// 	lines.exit().remove();
			
		// 	lines.enter().append("line").attr("class", "horz");
			
		//     lines.transition().attr({ "x1" : 0, "x2" : width,
	 //            "y1" : scaleFor(horzScale),
	 //            "y2" : scaleFor(horzScale)
	 //        });	  

	        
		// },

		// vertical = function() {
		// 	var lines = base.selectAll("line.vert").data(vertScale.ticks());
		    
		//     lines.exit().remove();

		//     lines.enter().append("line").attr("class", "vert");

		//     lines.transition().attr({ "y1" : 0, "y2" : height,
	 //            "x1" : scaleFor(vertScale),
	 //            "x2" : scaleFor(vertScale),
	 //        });	
		// }

		_export = {
			horz: horz,
			vert: vert,
			reset: reset
		};

		return _export;
	};


	var tooltips = function(base, overlay) {
		var tip = d3.tip()
			.attr("class", "d3-tip")
			.offset([-10, 0])
			.html(function(d) {
	    		return "<strong>test</strong>";
  			});

	  	var toggle = _.curry(function(state, p) {
	 		var svgElement = p.el[0][0];
			//p.el.interrupt().transition().ease("easeInQuad").duration(200).attr("stroke-width","5px");
			tip[state ? "show":"hide"](p.datum, svgElement);
			d3.select(svgElement).style("opacity", 1);
	 	});

	 	base.call(tip);

	 	var reset = function(selection) {
	 		//listener cleanup implicit, browser dependent (ie?)
	 		selection
	 			//.datum(function(d) { console.log(d); })
	 			//.on("mouseover", function() { console.log("tellmemore"); } /* toggle(true)*/)
	 			.on("click", function() { console.log("tellmemore"); } /* toggle(true)*/)
	 			.on("mouseout", tip.hide /* toggle(false)*/);
	 	}

	 	return {
	 		reset: reset
	 	};

	};

	// var tooltips = function(base) {
 		
 // 		var treeFactory = d3.geom.quadtree()
 //    		.x(function(d) { return d.x; })
	//     	.y(function(d) { return d.y; }),
 //    	radius = 3, root, currentHandler;

 //    	var tip = d3.tip()
	//   		.attr('class', 'd3-tip')
	//   		.offset([-10, 0])
	//   		.html(function(d) {
	//     		return "<strong>" + d.series + "</strong> <span style='color:red'>" + d.y + "</span>";
 //  		});

	//   	var toggle = _.curry(function(state, p) {
	//  		var svgElement = p.el[0][0];
	// 		//p.el.interrupt().transition().ease("easeInQuad").duration(200).attr("stroke-width","5px");
	// 		tip[state ? "show":"hide"](p.datum, svgElement);
	// 		d3.select(svgElement).style("opacity", 1);
	//  	}), 

	//  		over = toggle(true), out = toggle(false),

	//   // 	over = function(p) {
	//  	// 	var svgElement = p.el[0][0];
	// 		// //p.el.interrupt().transition().ease("easeInQuad").duration(200).attr("stroke-width","5px");
	// 		// tip.show(p.datum, svgElement);
	// 		// d3.select(svgElement).style("opacity", 1);
	//  	// },

	//  	// out = function(p) {
	//  	// 	var svgElement = p.el[0][0];
	// 		// tip.hide(p.datum, svgElement);
	// 		// d3.select(svgElement).style("opacity", 0);
	//  	// }, 



	//  	visitor = function(node, x1, y1, x2, y2) {
	// 		var p = node.point;
 			
 // 			if(p) {
 // 				var dx = coordPair[0] - node.point.x, dy = coordPair[1] - node.point.y, 
 // 					rad = Math.sqrt(dx*dx + dy*dy);

 // 				if(rad < radius) { 					
 // 					if(!p.inRadius) { 
	//  					p.inRadius = true;
	//  					over(p); 
 // 					} 					
 // 					return true;
 // 				} else if (p.inRadius) {
	// 				out(p);
	// 				p.inRadius = false;
	// 				return true;
 // 				}
 // 			}

 // 			return false;
 // 		},

 //    	moveHandlerFactory =  function(newRoot) {
 //    		return function() {
	//  			var coordPair = d3.mouse(this);
	// 			newRoot.visit(visitor);
	// 		}
	//  	};

	//   	base.call(tip);

 // 	 	var reset = function(coords) {
 // 	 		//if(currentHandler) base.off("mousemove", currentHandler);
 // 	 		currentHandler = moveHandlerFactory(treeFactory(coords));
	// 		base.on("mousemove", currentHandler);
 // 	 	};

 // 	 	//export
 // 	 	return {
 // 	 		reset: reset
 // 	 	};
	// };

	var areaGraph = function(config_, data_, color, tooltipRenderer, gridRenderer) {
		//variables
		var me = {}, config = config_, data = data_,
			shift, start, end, max, amountTickSuffix, innerWidth, innerHeight,
			stackedData;

		//constants
		var xAxisPadding = 100, yTicks = 4, axisTextPadding = { left: 10, top: 15 };

		var stackingMapperFactory = function(data) {
			return function(series, seriesIndex) { 
				return { 
					series: series, 
					values: data.y.map(function(item, innerIndex) { 
						return { 
							x: data.x[innerIndex],
							y: item[seriesIndex]
						};
					}) 
				};
			};
		};

		var stackedBarData = function(data) {
			return function(item, i) {
				var y0 = 0, obj = {};
				obj.x = data.x[i]; 
				
				obj.y = _.map(color.domain(), function(series, j) {
					return {
						series: series,
						y0: y0, 
						y1: y0 += item[j]
					}
				});

				return obj;
			}
		};


		//scales and data elements 
		var timeScale = d3.time.scale()
				.nice(d3.time.year),
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
		var	canvas = config.containers.panned.append("svg").attr("class", "canvas-area"),
			content = canvas.append("g").attr("clip-path", "url(#clip-area)"),
			clip = canvas.append("clipPath").attr("id", "clip-area").append("rect"),

			//overlay = config.containers.static.append("svg").attr("class", "overlay-area"),
			grid = inner(content), 
			graph = inner(content), 
			legend = inner(content), 

			title = legend.append("text").attr("class", "heading")
				.attr("text-anchor", "middle")
				.text("Úspešnosť firmy v tendroch za jednotlivé roky"),

			leftAxis = legend.append("g").attr("class", "axis-y axis-left"),
			rightAxis = legend.append("g").attr("class", "axis-y axis-right"),
			bottomAxis = timeAxis(graph, true),
			tooltips = tooltipRenderer(graph);
			


		var reset = function(/* newConfig, newData */) {
			config = arguments[0] || config;
			data = arguments[1] || data;
			initialize();
		},

		//private
		
		initialize = function() {
			shift = config.width / data.x.length;
			barWidth = shift / 4;
			innerWidth = config.width - shift; 
			innerHeight = config.height - (xAxisPadding);

			start = _.first(data.x); 
			end = _.last(data.x);

			max = _.max(_.map(data.y, function(item) { return _.reduce(item, sum)})) * 1.6;
			amountTickSuffix = config.amountTickSuffix;

			timeScale.domain([start, end]).range([0, innerWidth]),
			amountScale.domain([0, max]).range([innerHeight, 0]);

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
		},

		renderGrid = function() {
			gridRenderer(grid)
				.horz(amountScale)
				.vert(paddedTimeScale(config, data))
				.reset({
					width: config.width,
					height: config.height + xAxisPadding,
					tickAmount: yTicks
			});
		},

		renderArea = function() {
			var series = graph.selectAll(".series")				
		      	.data(stackedData);

		    series.enter()
		    	.append("path").attr("class", "series")
		    	.attr("d", function(d) { return flatArea(d.values); })
		    	.style("fill", function(d) { return color(d.series); })
		    	.style("opacity", 0);
		    	
		    series.transition().style("opacity", 1).attr("d", function(d) { return area(d.values); })
		    
		    series.exit().transition().style("opacity", 0).remove();
		},

		renderBars = function() {
			var bars = graph.selectAll(".segment").data(stackedData);      		
  			bars.enter().append("g").attr("class", "segment").attr("transform", function(d) { return "translate(" + timeScale(d.x) + ",0)"; });

  			var bands = bars.selectAll("rect").data(function(d) { return d.y; });
      		
      		bands.enter().append("rect")
				.style("opacity", 0)	
      			.style("fill", function(d) { return color(d.series); });
      		
      		bands.transition()
      			.style("opacity", 1)
      			.attr("width", barWidth)
      			.attr("x", -barWidth/2)      			
      			.attr("height", function(d) { return amountScale(d.y0) - amountScale(d.y1); })
      			.attr("y", function(d) { return amountScale(d.y1); });
			
			bars.transition().attr("transform", function(d) { return "translate(" + timeScale(d.x) + ",0)"; }),
			
			bands.exit().transition().style("opacity", 0).remove();
			bars.exit().remove();      		

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
		    	.style("opacity", 0)
		    	.attr("transform", "translate(" + (innerWidth + shift/2 - config.margin.right) + ",0)")		    
		  		.selectAll("text")
		    	//.attr("x", - axisTextPadding.left)
		    	.attr("y", axisTextPadding.top)
		    	.style("text-anchor", "end");

		    rightAxis.transition().style("opacity", 1);
	 		
	 		leftAxis		    	
		    	.call(amountAxis)
		    	.attr("transform", "translate(0,0)")
		    	.style("opacity", 0)
		  		.selectAll("text")
		    	.attr("x", -shift/2 + axisTextPadding.left)
		    	.attr("y", axisTextPadding.top)
		    	.style("text-anchor", "start");	

    		leftAxis.transition().style("opacity", 1);
	    },

	    renderXAxis = function() {
	    	bottomAxis.reset(data, timeScale, {x: 0, y: innerHeight}, amountTickSuffix);
	    },

		sizing = function() {

			var margin = config.margin,
				shifted = _.assign(_.clone(margin), { left: margin.left + shift/2 });

			resize(canvas, config, margin);
			resize(clip, config, margin);
			//resize(overlay, config, margin);
			remargin(grid, margin);
			remargin(graph, shifted);
			remargin(legend, shifted);

			repositionTitle();
		},

		repositionTooltips = function() {
			tooltips.reset(graph.selectAll(".segment"));
		},


		remargin = function(el, margin) {
			el.transition().attr("transform", "translate(" + (margin.left) + "," + (margin.top) + ")")
		},

		resize = function(el, size, margin) {
			el.transition().attr("width", size.width + margin.left + margin.right)
  			.attr("height", size.height + margin.top + margin.bottom);
		},

		repositionTitle = function() {
			title.transition().attr("x", innerWidth / 2).attr("y", 40)
		};
		
		return {
			reset: reset
		};

	};

	// rather thru amd - exports - export the constructed object, don't use prototype
	// var AreaGraph = function(config, data) {
	// }

	// _.assign(AreaGraph.prototype, {
		
	// 	reset: function(config, data) {
	// 		var me = this;
	// 		_.assign(me, { config: config, data: data });
	// 		me.initialize();
	// 	},
		
	// 	initialize: function() {
	// 		var me = this;

	// 		_.assign(me, {
	// 			shift: me.config.width / (me.data.x.length), 
	// 			start: _.first(me.data.x), end: _.last(me.data.x),
	// 			//get maximum per all points cross-series - multiplication is because of a certain padding from above
	// 			max: _.max(_.map(me.data.y, function(item) { return _.reduce(item, sum) })) * 1.6,
	// 			amountTickSuffix: me.config.amountTickSuffix,
	// 			xAxisPadding: 100, 
	// 			yTicks: 4,		
	// 			innerWidth: me.config.width - me.shift, innerHeight: me.config.height - (me.xAxisPadding);
	// 	})		

	// 	}


	// });


	var createAreaGraph = function(config, data) {
		
		var shift = config.width / (data.x.length), 
			volumes = data.volumesByYear,
			start = _.first(data.x), end = _.last(data.x),
			//get maximum per all points cross-series - multiplication is because of a certain padding from above
			max = _.max(_.map(data.y, function(item) { return _.reduce(item, sum) })) * 1.6,
			amountTickSuffix = config.amountTickSuffix,
			xAxisPadding = 100, 
			yTicks = 4,		
			innerWidth = config.width - shift, innerHeight = config.height - (xAxisPadding);

		//axis scales


		var timeScale = d3.time.scale()
				.domain([start, end])
				.nice(d3.time.year)
				.range([0, innerWidth]),

			amountScale = d3.scale.linear()
				.domain([0, max])
				//.nice(1)
				.range([innerHeight, 0]);

		var canvas = config.containers.panned.append("svg").attr("class", "canvas-area"),
			overlay = config.containers.static.append("svg").attr("class", "overlay-area"),
			grid = applySizing(config, canvas),

			//create a rect in the size of grid

			graphSizingConfig = _.assign(config, { 
				margin: _.assign(_.clone(config.margin), { 
					left: config.margin.left + shift/2 
				}) 
			}),			
			graph = applySizing(graphSizingConfig, canvas),
			graphOverlay = applySizing(graphSizingConfig, overlay);

		overlay.attr({ width: canvas.attr("width"), height: canvas.attr("height")}).append("text")
			.attr("class", "heading")
			.attr("y", 40)
			.attr("x", config.width / 2)
			.attr("text-anchor", "middle")
			.text("Úspešnosť firmy v tendroch za jednotlivé roky");

		createHorizontalLines(_.assign(config, { height: innerHeight}), grid, amountScale, yTicks);
		

		createVerticalLines(_.assign(config, { height: config.height + xAxisPadding }), grid, paddedTimeScale(config, data));
			
		// area graph
		var area = d3.svg.area()
	    	.x(function(d) { return timeScale(d.x); })
	    	.y0(function(d) { return amountScale(d.y0); })
	    	.y1(function(d) { return amountScale(d.y0 + d.y); });


	    // stacked data init
		var stack = d3.layout.stack().values(function(d) { return d.values; });

		color.domain(data.series);
		
		var stackedData = stack(color.domain()
			.map(function(series, seriesIndex) { 
				return { 
					series: series, 
					values: data.y.map(function(item, innerIndex) { 
						return { 
							x: data.x[innerIndex],
							y: item[seriesIndex]
						};
					}) 
				};
			})
		);

		// stacked area graph rendering
		var series = graph.selectAll(".series")
	      .data(stackedData).enter().append("g")
	      .attr("class", "series");

	   	series.append("path")
	      .attr("class", "area")
	      .attr("d", function(d) { return area(d.values); })
	      .style("fill", function(d) { return color(d.series); });


	    // data points container rendering
	    var points = graph.selectAll(".points")
	    	.data(stackedData).enter().append("g")
	    	.attr("class", "points")


	    // point rendering
	    points.each(function(d) {  
	    	var group = d3.select(this);

	    	group.selectAll("circle.point").data(function(d) {
	    		return d.values;
	    	}).enter().append("circle")
	    		//enrich the current datum on iteration
	    		.datum(function(pointDatum) { pointDatum.series = d.series; return pointDatum; })
		   		.attr("class", "point")
		   		.attr("cx", function(d) { return timeScale(d.x); })
		   		.attr("cy", function(d) { return amountScale(d.y0 + d.y); })
		   		.attr("r", 3)
		   		.style("opacity", 0)
		   		.attr("fill", color(group.data()[0].series));
	    });

	    // coordinate extraction
	    var coords = graph.selectAll(".point")[0].map(function(point) { 
	    	var p = d3.select(point);
	    	return { 
	    		el: p,
	    		datum: p.datum(),
	    		x: parseInt(p.attr("cx")),
	    		y: parseInt(p.attr("cy"))
	    	}; 
		});


	    //quadtree optimization for mouseover with snapping radius
	    
	    var treeFactory = d3.geom.quadtree()
	    	.x(function(d) { return d.x; })
	    	.y(function(d) { return d.y; });


	    var root = treeFactory(coords),
	    	radius = 3;

	 	graph.on("mousemove", function() {
	 		var coords = d3.mouse(this);
			
			root.visit(function(node, x1, y1, x2, y2) {
				var p = node.point;
	 			
	 			if(p) {
	 				var dx = coords[0] - node.point.x, dy = coords[1] - node.point.y, 
	 					rad = Math.sqrt(dx*dx + dy*dy);

	 				if(rad < radius) { 					
	 					if(!p.inRadius) { 
		 					p.inRadius = true;
		 					over(p); 
	 					} 					
	 					return true;
	 				} else if (p.inRadius) {
						out(p);
						p.inRadius = false;
						return true;
	 				}
	 			}

	 			return false;
	 		});
	 	});


	 	//tooltip rendering

		var tip = d3.tip()
	  		.attr('class', 'd3-tip')
	  		.offset([-10, 0])
	  		.html(function(d) {
	    		return "<strong>" + d.series + "</strong> <span style='color:red'>" + d.y + "</span>";
	  		});

	  	graph.call(tip);

	 	var over = function(p) {
	 		var svgElement = p.el[0][0];
			//p.el.interrupt().transition().ease("easeInQuad").duration(200).attr("stroke-width","5px");
			tip.show(p.datum, svgElement);
			d3.select(svgElement).style("opacity", 1);
	 	};

	 	var out = function(p) {
	 		var svgElement = p.el[0][0];
			tip.hide(p.datum, svgElement);
			d3.select(svgElement).style("opacity", 0);
	 	};

	 	//axis rendering

	 	var amountAxis = d3.svg.axis()
	 			.scale(amountScale).orient("right").ticks(yTicks).tickFormat(function(d) {
	 				return d + amountTickSuffix;
	 			});

 		var renderYAxes = function(parent) {
				var textPadding = { left: 10, top: 15 };

		 		parent.append("g")
			    	.attr("class", "axis-y axis-left")
			    	.attr("transform", "translate(" + innerWidth + ",0)")
			    	.call(amountAxis)
			  		.selectAll("text")
			    	.attr("x", - textPadding.left)
			    	.attr("y", textPadding.top)
			    	.style("text-anchor", "end");
		 		
		 		parent.append("g")
			    	.attr("class", "axis-y axis-right")
			    	.attr("transform", "translate(0,0)")
			    	.call(amountAxis)
			  		.selectAll("text")
			    	.attr("x", -shift/2 + textPadding.left)
			    	.attr("y", textPadding.top)
			    	.style("text-anchor", "start");			    	
		}

		new TimeAxis({
	   		parent: graph, scale: timeScale, data: data, suffix: config.amountTickSuffix
	   	}).pos(0, innerHeight).render();
    	
    	//these need to be put in a different svg container entirely, since the whole thing will be panned
    	renderYAxes(graphOverlay);  	

	};


	// var points = { 
	// 	series: ["Plastika Nitra", "Prvá tunelárska"],
	// 	x: [2005, 2006, 2007, 2008, 2009, 2010] ,
	// 	y: [[50, 10], [30, 20], [20, 10], [50, 20], [20, 15], [220, 13]],
	// 	timeline: [[
	// 		{ position: "Štatutár", ranges: [[2005, 2008]] },
	// 		{ position: "Zástupca riaditeľa", ranges: [[2008, 2009]] }
	// 	],[
	// 		{ position: "Štatutár", ranges: [[2005, 2007], [2009, 2010]] },
	// 		{ position: "Zástupca riaditeľa", ranges: [[2005, 2008]] }
	// 	]]
	// }; 	
	    	
	var createTimeline = function(config, data) {

		var canvas = config.containers.panned.append("svg").attr("class", "canvas-timeline"),
			overlay = config.containers.static.append("svg").attr("class", "overlay-timeline"),

			grid = applySizing(config, canvas),
			timeline = applySizing(config, canvas),	
			timelineOverlay = applySizing(config, overlay),

			start = _.first(data.x), end = _.last(data.x),
			shift = config.width / (data.x.length),
			
			//graph = applySizing(_.assign(config, { padding: { left: shift/2 }}), canvas);
		
			
			//timelineGridContainer = applySizing(config, d3.select("#grid").append("svg")).attr("class", "bg-grid-timeline");			

			timeScale = d3.time.scale()
				.domain([start, yearEnd(end.getFullYear())])
				.nice(d3.time.year)
				.range([0, config.width]);

			color.domain(data.series);

			overlay.append("text")
				.attr("class", "heading")
				.attr("y", 40)
				.attr("x", config.width / 2)
				.attr("text-anchor", "middle")
				.text("Vystupovanie osoby vo firmách");

			createVerticalLines(config, grid, paddedTimeScale(config, data));

			var denormalizedSeriesByPosition = _.flatten(data.timeline.map(function(item, seriesIndex) {
				return item.map(function(segment) { 
					//inject series name into the position object
					return _.assign(segment, { series: data.series[seriesIndex] }); });
			})),
				denormalizedSeriesByRange = _.flatten(denormalizedSeriesByPosition.map(function(item) {
					// inject data to range object
					return item.ranges.map(function(range) { return { from: range[0], to: range[1], series: item.series, position: item.position }; });
				}));

			var rangeKey = function(item) { return item.series + item.position; },
				yScale = d3.scale.ordinal()
					.domain(denormalizedSeriesByPosition.map(rangeKey))
					.rangePoints([config.padding.top + 30, config.height - (config.padding.top + 60)]),
				verticalPosition = function(d) { return yScale(rangeKey(d)) + 5; };


			timeline.selectAll(".bar-bg")
    			.data(denormalizedSeriesByPosition).enter().append("line")
		        .attr({ "x1" : config.tipCompensation + shift/2, "x2" : config.width - config.tipCompensation - shift/2,
		            "y1" : verticalPosition,
		            "y2" : verticalPosition,
		            "class": "bar-bg"
		        });

			timeline.selectAll(".bar")
    			.data(denormalizedSeriesByRange).enter().append("line")
		        .attr({ 
		        	"x1" : function(d) { 
		        		var date = yearStart(d.from), 
		        			compensatedStart = 
		        				date.getFullYear() == start.getFullYear() ? yearMid(d.from):yearStart(d.from) 
		        		return timeScale(compensatedStart) + config.tipCompensation; 
		        	}, 
		        	"x2" : function(d) { 
		        		var date = yearEnd(d.to), 
		        			compensatedEnd = 
		        				date.getFullYear() == end.getFullYear() ? yearMid(d.to):yearEnd(d.to) 
		        		return timeScale(compensatedEnd) - config.tipCompensation; 
		        	},
		            "y1" : verticalPosition,
		            "y2" : verticalPosition,
		            "class": "bar"
		        })
		        .style("stroke", function(d) { return color(d.series) });
		    


		    timelineOverlay.append("g").attr("class", "labelgroup-left")
		    	.attr("transform", "translate(" + shift/2 + ",-" + config.labelPadding + ")")
		    	.selectAll(".label").data(denormalizedSeriesByRange).enter().append("text")
		    	.attr({"x": 0, "y": verticalPosition, "class": "label"})
		    	.text(function(d) { return d.position });

		    timelineOverlay.append("g").attr("class", "labelgroup-right")
		    	.attr("transform", "translate(" + (config.width - shift/2) + ",-" + config.labelPadding + ")")
		    	.selectAll(".label").data(denormalizedSeriesByRange).enter().append("text")
		    	.attr({"x": 0, "y": verticalPosition, "class": "label"})
		    	.text(function(d) { return d.position });	
		   	
		   	new TimeAxis({
		   		parent: timeline, scale: timeScale, data: data, renderSums: false
		   	}).pos(shift/2, config.height - 120).render();
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

		console.log(barData);

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
		series: ["Plastika Nitra", "Prvá tunelárska"],
		x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,
		y: [[50, 10], [60, 10], [20, 70], [50, 11], [20, 15], [150, 13], [10, 60]],
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
		margin: { left: 20, top: 20, bottom: 0, right: 20},
		padding: {},
		width: 960, height: 400,
		amountTickSuffix: " mil €",
		containers: containers("#area")
	},  areaConfig2 = {
		margin: { left: 20, top: 20, bottom: 0, right: 20},
		padding: {},
		width: 660, height: 400,
		amountTickSuffix: " mil €",
		containers: containers("#area")
	} 

	
	var timelineConfig = {
		margin: _.assign(_.clone(areaConfig.margin), { top: 0 }),
		width: areaConfig.width,
		height: 360,
		padding: { top: 60, bottom: 0},
		tipCompensation: 4,
		labelPadding: 15,
		containers: containers("#timeline")
	};

	
	var barChartConfig = {
		margin: _.assign(_.clone(areaConfig.margin), { top: 30, bottom: 40 }),
		width: areaConfig.width,
		height: 30,
		padding: { left: 0 },
		amountTickSuffix: areaConfig.amountTickSuffix,
		containers: containers("#bar")
	};

	var gr = areaGraph(areaConfig, points, color, tooltips, grid);
	gr.reset();

	//_.delay(function() { gr.reset(areaConfig2, points3); }, 2000);
	//_.delay(function() { gr.reset(areaConfig, points); }, 4000);
	
	// createHorizontalBarChart(barChartConfig, points);
	
	// createAreaGraph(config, points);

	// createTimeline(timelineConfig, points);


});

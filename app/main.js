define(["lodash", "c3", "d3", "d3-tip"], function(_, c3, d3) {

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

		var canvas = d3.select("#graph").append("svg").attr("class", "canvas-area"),
			grid = applySizing(config, canvas),
			graph = applySizing(
				_.assign(config, { 
					margin: _.assign(_.clone(config.margin), { 
						left: config.margin.left + shift/2 
					}) 
				}), canvas);

		canvas.append("text")
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
	 	}

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
    	renderYAxes(graph);  	

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

		var canvas = d3.select("#graph").append("svg").attr("class", "canvas-timeline"),		
			grid = applySizing(config, canvas),
			timeline = applySizing(config, canvas),	

			start = _.first(data.x), end = _.last(data.x),
			shift = config.width / (data.x.length),
			
			//graph = applySizing(_.assign(config, { padding: { left: shift/2 }}), canvas);
		
			
			//timelineGridContainer = applySizing(config, d3.select("#grid").append("svg")).attr("class", "bg-grid-timeline");			

			timeScale = d3.time.scale()
				.domain([start, yearEnd(end.getFullYear())])
				.nice(d3.time.year)
				.range([0, config.width]);

			color.domain(data.series);

			canvas.append("text")
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
				verticalPosition = function(d) { return yScale(rangeKey(d)); };


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
		    


		    timeline.append("g").attr("class", "labelgroup-left")
		    	.attr("transform", "translate(" + shift/2 + ",-" + config.labelPadding + ")")
		    	.selectAll(".label").data(denormalizedSeriesByRange).enter().append("text")
		    	.attr({"x": 0, "y": verticalPosition, "class": "label"})
		    	.text(function(d) { return d.position });

		    timeline.append("g").attr("class", "labelgroup-right")
		    	.attr("transform", "translate(" + (config.width - shift/2) + ",-" + config.labelPadding + ")")
		    	.selectAll(".label").data(denormalizedSeriesByRange).enter().append("text")
		    	.attr({"x": 0, "y": verticalPosition, "class": "label"})
		    	.text(function(d) { return d.position });	
		   	
		   	new TimeAxis({
		   		parent: timeline, scale: timeScale, data: data, renderSums: false
		   	}).pos(shift/2, config.height - 100).render();
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

		var barChart = applySizing(config, d3.select("#graph").append("svg").attr("class", "canvas-barchart"));

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
		y: [[50, 10, 20], [60, 10, 40], [20, 70, 15], [50, 20, 28], [20, 15, 30], [150, 13, 50 ], [100, 60, 40]],
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

	// points.timeline = points.timeline.map(function(series) {
	// 	return series.map(function(position) { 
	// 		return _.assign(position, { ranges: 
	// 			position.ranges.map(function(range) { return [yearStart(range[0]), yearStart(range[1])]; }) });
	// 	});
	// });
	
	var config = {
		margin: { left: 20, top: 0, bottom: 0, right: 20},
		padding: {},
		width: 960, height: 400,
		amountTickSuffix: " mil €"
	};

	
	var timelineConfig = {
		margin: _.assign(_.clone(config.margin), { top: 0 }),
		width: config.width,
		height: 360,
		padding: { top: 60, bottom: 0},
		tipCompensation: 4,
		labelPadding: 10
	};

	
	var barChartConfig = {
		margin: _.assign(_.clone(config.margin), { top: 30, bottom: 40 }),
		width: config.width,
		height: 30,
		padding: { left: 0 },
		amountTickSuffix: config.amountTickSuffix
	};

	
	createHorizontalBarChart(barChartConfig, points);
	
	createAreaGraph(config, points);

	createTimeline(timelineConfig, points);

});

"use strict";
define("znd-graph-controls", ["d3", "lodash", "util", "znd-graph-config", "jquery"], function(d3, _, util, globalConfig, $) {

	var threshold = 1, events = { "seriesToggled": "seriesToggled", "groupingToggled": "groupingToggled" };



	var groupByThreshold = function(data) {
		//above = _.take(descending, threshold), below = _.takeRight(descending, descending.length - threshold),

		var cloned = _.cloneDeep(data), remainingId = "Ostatné", remainingCount = data.series.length - threshold;

		cloned.series = _.take(data.series, threshold).push(remainingId);

		cloned.y = _.map(data.y, function(arr) { 
			return _.take(arr, threshold).push(
				_.reduce(_.takeRight(arr, remainingCount), util.sum)
			); 
		});

		return cloned;
	};

			// data.y = _.map(data.y, function(arr) { _.map(arr,) })
		// var points = { 
  //       series: ["Plastika Nitra", "Prvá tunelárska", "Váhostav"],
  //       x: [2005, 2006, 2007, 2008, 2009, 2010, 2011] ,
  //       y: [[50, 10, 20], [0, 0, 0], [0, 0, 0], [50, 20, 28], [20, 15, 30], [150, 13, 50 ], [100, 60, 40]],
  //       timeline: [[
  //           { position: "Štatutár", ranges: [[2005, 2008]] },
  //           { position: "Zástupca riaditeľa", ranges: [[2008, 2009]] }
  //       ],[
  //           { position: "Štatutár", ranges: [[2005, 2007], [2009, 2010]] },
  //           { position: "Zástupca riaditeľa", ranges: [[2005, 2008]] }
  //       ],[
  //           { position: "Kotolník", ranges: [[2005, 2011]] },
  //       ]]
 


		// //sort by aggregated

		// if(data.series.length > threshold) {

		// }



	var sortByAggregateSum = function(data) {

		var cloned = _.cloneDeep(data),
			descending = _.sortBy(_.zip(data.series, util.aggregates(data)), function(pair) { return -pair[1]; }),

			indexes = _.map(descending, function(pair) { return _.indexOf(data.series, pair[0]); });
			
			cloned.y = _.map(data.y, function(arr) { 
				return _.map(indexes, function(index) { 
					return arr[index]; } 
				)
			});

			cloned.series = _.map(indexes, function(index) { 
				return data.series[index];
			});

			cloned.timeline = _.map(indexes, function(index) { 
				return data.timeline[index];
			});
		
		return cloned;
	};


	var toggleButton = function(parent, config) {
		var createdButton = parent.append("a");

		createdButton
			.text(config.text)
			.attr({ "class": "icon", "href": "#", "id": config.id })
			.append("svg").append("use").attr("xlink:href", globalConfig.spritesPath + "#" + config.spriteName)

		return createdButton;
	}, 
	
	controlListItem = function(parent) {
		var item = parent.append("li"), activityClass = "active",
	
			doToggle = function(series) {

				var active = _.contains(
					$(this).parents("li").toggleClass(activityClass)[0].classList, 
					activityClass
				); 

				util.bus.fire(events.seriesToggled, [series, active]);
			},
			
			itemContent = item
				.attr("class", "company")
				.append("label"),
			
			checkbox = itemContent
				.append("input")
				.attr("type", "checkbox")
				.on("change", doToggle),
			
			label = itemContent
				.append("b").style("color", function(item) { return globalConfig.colors(item); }),

			circle = itemContent.append("svg")
				.attr({ "width": "12", "height": "12", "x": 0, "y": 0})
				.append("circle")
					.attr({ "cx": 6, "cy": 6, "r": 6})
					.attr("fill", function(item) { return globalConfig.colors(item); });

		label.text(function(d) { return d; })					

		return item;
	};
	
	
	var controls = function(config, data) {
		var export_, klass = "control", 
			buttonConfig = { 
				collapse: { spriteName: "show-less", id: "join-group", text: "Zobraziť menej" }, 
				expand: { spriteName: "show-more", id: "break-group" , text: "Zobraziť viac" }
			};			

		var controls = config.container.append("ul"),
			expand = toggleButton(config.container, buttonConfig.expand),
			collapse = toggleButton(config.container, buttonConfig.collapse);


		var reset = function() {
			
			var items = controls.selectAll("." + klass).data(data.series);
			items.exit().remove();
			
			var enterSelection = controlListItem(items.enter());

			collapse();
		},

		onSeriesToggled = function(handler) {
			return util.bus.on(events.seriesToggled, handler);
		},

		onGroupingToggled = function(handler) {
			return util.bus.on(events.groupingToggled, handler);
		},

		export_ = {
			reset: reset,			
			onSeriesToggled: onSeriesToggled,
			onGroupingToggled: onGroupingToggled
		};

		return export_;
	};


	// util.bus.on(events.filterItemToggled, function() {
	// 	console.log(arguments);
	// });


	return controls;
});

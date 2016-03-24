
define("znd-graph-controls", ["d3", "lodash", "util", "znd-graph-config", "jquery", "znd-graph-colors"], function(d3, _, util, globalConfig, $, colors) {
	"use strict";

	var threshold = 1, events = { "seriesToggled": "seriesToggled", "groupingToggled": "groupingToggled" };

	// push to template?
	var toggleButton = function(parent, config, isExpander) {
		var createdItem = parent.append("li").attr("class", "toggle"),
			createdButton = createdItem.append("a"),
			hide = function() {
				createdItem.style("display", "none");
			},
			show = function() {
				createdItem.style("display", "block");
			};

		createdButton
			.attr({ "class": "icon", "href": "#", "id": config.id })
			.append("svg").append("use").attr("xlink:href", globalConfig.spritesPath + "#" + config.spriteName);

		createdButton.insert("span", isExpander ? "svg": null).text(config.text);

		createdButton.on("click", function() {
			util.bus.fire(events.groupingToggled, [isExpander || false]);
		});

		createdButton.hide = hide;
		createdButton.show = show;

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
				.attr("class", "company active")
				.append("label"),

			checkbox = itemContent
				.append("input")
				.attr("type", "checkbox")
				.attr("checked", "checked")
				.on("change", doToggle),

			label = itemContent
				.append("b").style("color", function(item) { return colors.getColor(item); }),

			circle = itemContent.append("svg")
				.attr({ "width": "12", "height": "12", "x": 0, "y": 0})
				.append("circle")
					.attr({ "cx": 6, "cy": 6, "r": 6})
					.attr("fill", function(item) { return colors.getColor(item); });

		label.text(function(d) { return d; });

		return item;
	};


	var controls = function(config) {
		var export_, data, series, klass = "company",
			buttonConfig = {
				collapse: { spriteName: "show-less", id: "join-group", text: "Zobraziť menej" },
				expand: { spriteName: "show-more", id: "break-group" , text: "Zobraziť viac" }
			};

		var controls = config.container.append("ul").attr("class", "list"),
			expand = toggleButton(config.container, buttonConfig.expand, true),
			collapse = toggleButton(config.container, buttonConfig.collapse);

		var groupingHandler = function(evt, state) {
 			if(state) {
 				expand.hide(); collapse.show();
 			} else {
 				expand.show(); collapse.hide();
 			}
 		},

		reset = function(newData) {
			series = newData.series;

			controls.selectAll("." + klass).remove();
			var items = controls.selectAll("." + klass).data(series);

			controlListItem(items.enter());
		},



		onSeriesToggled = function(handler) {
			return util.bus.on(events.seriesToggled, handler);
		},

		onGroupingToggled = function(handler) {
			return util.bus.on(events.groupingToggled, handler);
		};

		export_ = {
			reset: reset,
			onSeriesToggled: onSeriesToggled,
			onGroupingToggled: onGroupingToggled
		};

 		util.bus.on(events.groupingToggled, groupingHandler);

 		groupingHandler(null, true);
		return export_;
	};


	// util.bus.on(events.filterItemToggled, function() {
	// 	console.log(arguments);
	// });


	return controls;
});


define("znd-graph-controls", ["d3", "lodash", "util", "znd-graph-config", "jquery", "znd-graph-colors", "znd-graph-support"], function(d3, _, util, globalConfig, $, colors, support) {
	"use strict";

	var events = { "seriesToggled": "seriesToggled", "groupingToggled": "groupingToggled" }, //,threshold = 1,
		numberFormat = support.numberFormat();

	var controls = function(config) {
		var export_, data, series, itemClass = "company", visibilityClass = "active",
			controlsTemplate = _.template($("#tpl-controls").html());

		var controls;

		var
			groupingActionHandler = function(evt) {
				var toggle = controls.find("#break-group").get(0) === this;
				evt.preventDefault();
				util.bus.fire(events.groupingToggled, [toggle]);
			},

			hideControlsIfUnnecessary = function(data, elementsToHide) {
				var thresholdHigherThanDataLength = globalConfig.groupingThreshold + 1 >= data.series.length;
				if(thresholdHigherThanDataLength) {
					_.each(elementsToHide, function(el) { el.hide(); });
					return true;
				}
				return false;
			},

			evaluateGroupingButtonVisibility = function(data) {

				var expand = controls.find("#break-group"), collapse = controls.find("#join-group"),
					isInGroupedState = _.contains(data.series, globalConfig.groupingAggregateName);

				if(!isInGroupedState && hideControlsIfUnnecessary(data, [expand, collapse])) return;

				if(isInGroupedState) {
					expand.show(); collapse.hide();
	 			} else {
					expand.hide(); collapse.show();
	 			}
		},

		seriesTogglingActionHandler = function() {
			var parentListItem = $(this).parents("li").get(0),
				seriesName = $(parentListItem).attr("data-series"),
				parentListItemClasses = parentListItem.className.split(" "),
				isCurrentlyActive = _.contains(parentListItemClasses, visibilityClass);

			$(parentListItem).toggleClass(visibilityClass);

			util.bus.fire(events.seriesToggled, [seriesName, !isCurrentlyActive]);
		},

		getTemplateModel = function(data) {

			var aggregates = util.aggregates(data),
				percentages = _.map(util.percentages(data), function(perc) { return perc.toFixed(2); });

			return _.map(data.series, function(seriesName, index) {

				var result = {
					seriesName: seriesName,
					percentage: percentages[index],
					sum: numberFormat.amountRendererForControls(aggregates[index]),
					aggregatedCount: (seriesName === globalConfig.groupingAggregateName) ? data.meta.aggregatedCount:"",
					color: colors.getColor(seriesName)
				};

				return result;
			});
		},

		attachHandlersToControls = function() {

			controls.find("input[type=checkbox]").on("change", seriesTogglingActionHandler);
			controls.find("#break-group, #join-group").on("click", groupingActionHandler);

		},

		reset = function(newData) {
			numberFormat.reset(newData);
			config.container.empty();
			controls = $(controlsTemplate({ model: getTemplateModel(newData) })).appendTo(config.container);
			attachHandlersToControls();
			evaluateGroupingButtonVisibility(newData);
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

		return export_;
	};

	return controls;
});

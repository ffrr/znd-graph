"use strict";
define("znd-graph",["znd-graph-config", "znd-graph-support", "znd-graph-navigation", "lodash", "c3", "d3", "jquery", "util"], function(graphConfig, support, navigation, _, c3, d3, $, util) {
    
    var tooltipRenderer = support.tooltips, 
        gridRenderer = support.grid, 
        pos = support.positionalUtils, 
        paddedTimeScale = support.paddedTimeScale,
        window_ = support.window_,
        timeAxis = support.timeAxis,
        nav = navigation.navigation,
        color = graphConfig.colors;

    var inner = function(base) {
        return base.append("g");
    };

    var parseTransform = function(a) {
        var b={};
        for (var i in a = a.match(/(\w+\((\-?\d+\.?\d*e?\-?\d*,?\s?)+\))+/g)) { 
            var c = a[i].match(/[\w\.\-]+/g);
            b[c.shift()] = c;
        }
        return b;
    };
    

    var barGraph = function(config, data) {
        //variables

        var me = {}, dir,
            columnWidth, margin, dataWindow, barWidth, extendedMargin, start, end, max, amountTickSuffix, innerWidth, innerHeight,
            stackedData, export_, navig, incSegments, currentPan;

        var id = util.randomId();

        //constants
        var xAxisPadding = 100, yTicks = 4, axisTextPadding = { left: 10, top: 15 };

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
        var canvas = config.container.append("svg").attr("class", "canvas-area"),           
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

            max = _.max(_.map(data.y, function(item) { return _.reduce(item, util.sum)})) * 1.6;
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
        //  var series = graph.selectAll(".series")             
        //          .data(stackedData);

        //     series.enter()
        //      .append("path").attr("class", "series")
        //      .attr("d", function(d) { return flatArea(d.values); })
        //      .style("fill", function(d) { return color(d.series); })
        //      .style("opacity", 0);
                
        //     series.transition().style("opacity", 1).attr("d", function(d) { return area(d.values); })
            
        //     series.exit().transition().style("opacity", 0).remove();
        // },

        renderBars = function() {
                                    
            var bars = graph.selectAll(".segment").data(stackedData);


            bars.enter().append("g").attr("class", "segment");

            bars.transition().attr("transform", function(d) { return "translate(" + (timeScale(d.x)) + ",0)"; });

            var bands = bars.selectAll("rect").data(function(d) { return d.y; });
            
            bands.enter().append("rect")
                .style("fill", function(d) { return color(d.series); });


            bands.transition()
                .style("opacity", 1)
                .attr("width", barWidth)
                .attr("y", function(d) { return amountScale(d.y1); })
                .attr("x", -barWidth/2)                 
                .attr("height", function(d) { return amountScale(d.y0) - amountScale(d.y1); });
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
                .attr("transform", "translate(" + (innerWidth + columnWidth/2 - config.margin.right) + ",0)")           
                .selectAll("text")
                .attr("x", - axisTextPadding.left)
                .attr("y", axisTextPadding.top)
                .style("text-anchor", "end");

            
            leftAxis                
                .call(amountAxis)
                .attr("transform", "translate(0,0)")
                //.style("opacity", 0)
                .selectAll("text")
                .attr("x", -columnWidth/2 + axisTextPadding.left)
                .attr("y", axisTextPadding.top)
                .style("text-anchor", "start"); 

        },

        renderXAxis = function() {
            bottomAxis.reset(data, timeScale, {x: 0, y: innerHeight}, amountTickSuffix);
        },

        sizing = function() {
            pos.resize(canvas, config, margin);
            pos.innerClip(clip, config, margin);
            
            pos.remargin(grid, margin);
            pos.remargin(graph, extendedMargin);
            pos.remargin(legend, extendedMargin);

            repositionTitle();
        },

        repositionTooltips = function() {
            tooltips.reset(graph.selectAll(".segment"));
        },


        repositionTitle = function() {
            title.transition().attr("x", innerWidth / 2).attr("y", 40);
        };
        
        export_ = {
            reset: reset,
            left: left,
            right: right
        };

        return export_;
    };

    var timeline = function(config, data) {

        var config, data, start, end, columnWidth, innerHeight,  dataWindow, positionalSeries, rangedSeries, contentMask, axisMask, navig,
            innerY, currentPan, titleHeight = 18, titleToTimelinePadding = 20, axisTextPadding = { left: 10, top: 15 };

        //init defaults

        var id = util.randomId();

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

            bottomAxis = timeAxis(timeline, false),

            pointer = legend.append("circle")
                .attr({"r": 4, "fill": "transparent", "stroke": "#FFF", "stroke-width": 2});

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
                .domain([start, end])
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
            

            repositionTooltips();

            sizing();
            pan(currentPan !== null && currentPan !== undefined ? currentPan:navig.last());

            renderCirclePointer();
        },


        generateTooltipDescription = function(segment) {
            var company = "<em class=\"company\"><%= company %></em>",
                position = "<span class=\"position\"><%= position %></span>",
                ranges = "<span class=\"ranges\"><%= _.map(ranges, function(range) { return range.from + ' - ' + range.to; }).join(', ') %></span>",
                tpl = _.template(["<div class=\"tooltip-timeline\">", company, position, ranges, "</div>"].join("")),                   
                model = {
                        company: segment.series,
                        position: segment.position,
                        ranges: _.map(segment.ranges, function(range) {
                            var from = range[0].toLocaleDateString("sk-SK"),
                                to = range[1] instanceof Date ? range[1].toLocaleDateString("sk-SK"):"súčasnosť";
                            return { from: from, to: to };
                        })
                };
            return tpl(model);
        },

        denormalizeSeries = function() {

            //denormalize series by position
            positionalSeries = _.flatten(data.timeline.map(function(item, seriesIndex) {
                return item.map(function(segment) { 
                    var ret = _.assign(segment, { series: data.series[seriesIndex] });
                    return _.assign(ret, { tooltipDescription: generateTooltipDescription(ret) });
                })
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
                    return timeScale(d.from) + config.tipCompensation; 
                }, 
                "x2" : function(d) { 
                    return (d.to instanceof Date ? timeScale(d.to):timeScale(util.yearEnd(end.getFullYear()))) - config.tipCompensation; 
                },
                "y1" : verticalPosition,
                "y2" : verticalPosition,
                "class": "bar"
            }).style("stroke", function(d) { return color(d.series) });

            renderOverlays(timeline);
        },

        renderCirclePointer = function() {
            var containerEl = $(config.container[0][0]),
                tooltipEl = containerEl.children(".d3-tip").first();

            timeline.selectAll(".bar-overlay").on("mousemove", function() {
                var currentShift = pointer[0][0].getCTM().e,
                    currentDatum = d3.select(d3.event.srcElement).datum();

                pointer.attr({ "cx": d3.event.x - currentShift, "cy": verticalPosition(currentDatum) });                

                tooltipEl.css({
                    left: d3.event.x - tooltipEl.width() / 2 - 6, 
                    top: verticalPosition(currentDatum) + containerEl.position().top - (tooltipEl.height() + 40)
                });

                tooltipEl.html(currentDatum.tooltipDescription)
            });

            canvas.on("mouseover", function() {
                tooltipEl.show();
                pointer.style("visibility", "visible"); 
            });

            canvas.on("mouseout", function() {
                var toParent = _.includes($(d3.event.toElement).parents().get(), tooltipEl[0]);
                if(d3.event.toElement !== tooltipEl[0] /* && !toParent */)  { //add parent detection
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

        },


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

    var horizontalBarChart = function(config, data) {
        
        var aggregate, total, barData, computedHeight;

        var xScale = d3.scale.linear(),
            canvas = config.container.append("svg").attr("class", "canvas-barchart"),
            barChart = inner(canvas),
            grid = inner(canvas),
            amountAxis = d3.svg.axis().orient("bottom").tickFormat(function(d) {
                return d + config.amountTickSuffix;
            }),
            bottomAxis = barChart.append("g").attr("class", "axis-x");



        var reset = function(/* newData, newConfig */) {
            data = arguments[0] || data;
            config = arguments[1] || config;
            initDefaults();
            initialize();
        },

        initDefaults = function() {

            _.defaults(config, {
                barHeight: 30,
                bottomAxisHeight: 20,
                padding: {},
                margin: {},
                amountTickSuffix: " mil €"
            });

            computedHeight = config.barHeight + config.bottomAxisHeight;

            _.defaults(config.padding, {
                top: 30, bottom: 40
            });

            _.defaults(config.margin, {
                 left: 0, top: 0, right: 0, bottom: 0
            });
        },

        initialize = function() {
            aggregate = util.aggregates(data);
            total = util.totals(data);

            // aggregate = _.zip.apply(null, data.y).map(function(arr) { //get the aggregated sum of each series
            //     return _.reduce(arr, util.sum);
            // });

            // total = _.reduce(aggregate, util.sum);

            barData =  aggregate.map(function(item, index) { 
                return { sum: item, series: data.series[index] }
            });

            barData.map(function(item, index) {
                return _.assign(item, { runningTotal: index > 0 ? (item.sum + barData[index - 1].runningTotal):item.sum, })
            });

            xScale.domain([0, total]).range([0, config.width]);

            amountAxis.scale(xScale).tickValues([0, total]);

            renderBarChart();
            renderGrid();
            renderXAxis();

            sizing();
        },

        renderBarChart = function() {
            var bars = barChart.selectAll(".segment").data(barData);

            bars.exit().remove();

            bars.enter()
                .append("rect").attr("class", "segment");

            bars.attr("height", config.barHeight)
                .attr("y", 0)
                .attr("fill", function(d) { return color(d.series); });

            bars.transition().attr("x", function(d, index) { return xScale(d.runningTotal - d.sum); })
                .attr("width", function(d) { return xScale(d.sum); });
        },

        renderGrid = function() {
            gridRenderer(grid)
                .vert(xScale, xScale.ticks(10))
                .reset({
                    width: config.width,
                    height: config.barHeight
            });
        },

        renderXAxis = function() {
            bottomAxis
                .call(amountAxis)
                .attr("transform", "translate(0, "+ config.barHeight +")")
                .selectAll("text")
                .attr("y", 10)
                .style("text-anchor", function(d) { return d == 0 ? "start":"end"; });
        },

        sizing = function() {
            var margin = config.margin;

            pos.resize(canvas, _.assign(config, { height: computedHeight }), margin);

            pos.remargin(grid, margin);
            pos.remargin(barChart, margin);
        };

        return {
            reset: reset
        };
    };


    return {
        barGraph: barGraph,
        timeline: timeline,
        horizontalBarChart: horizontalBarChart
    };

});

"use strict";
define("znd-graph-support", ["lodash","d3", "util", "d3-tip"], function(_, d3, util) {
    
    var orderMap = ["", " tis.", " mil.", " mld."];

    var scaleFor = function(scale) { return function(d) { return scale.call(window, d); }};

    var paddedTimeScale = function(width, data) {
        var ret = d3.time.scale()
            .domain([_.first(data.x), util.yearStart( _.last(data.x).getFullYear() + 1)])
            .range([0, width]);
        return ret;
    };

    var numberFormat = function() {

        var data, amountTickSuffix = " €",

        reset = function(newData) {
            data = newData;
            // var maximum = util.detectMaximum(data);
            // _.each(orderMap, function(orderSpec) {
            //     var currentSuffix = orderSpec[1], currentDivider = orderSpec[0];
            //     if(currentDivider < maximum) {
            //         orderSuffix = currentSuffix;
            //         orderDivider = currentDivider;
            //     } else {
            //         return false;
            //     }                        
            // });
        },

        getOrderIndex = function(number) {
            // return the index of the order from orderMap - needs to be clamped,
            // so we don't get an IndexOutOfBounds error
            return util.clamp(Math.floor(Math.log10(number) / 3), 0, 3);
        },

        getOrderDivider = function(orderIndex) {
             return Math.pow(10, (orderIndex) * 3);
        },

        formatNumber = function(number) {
            var orderIndex = getOrderIndex(number);
            /* incidentally, the order of decimal places is the same as the index */
            return ((number / getOrderDivider(orderIndex)).toFixed(orderIndex ? orderIndex - 1:0) + "").replace(".", ",") 
                + orderMap[orderIndex] + amountTickSuffix;
        },

        amountRendererForTooltip = function(d) {
            return formatNumber(d);
        },

        amountRendererForAxis = function(d) {
            return formatNumber(d);
        },

        yearlySumRenderer = function(d, index) {
            return formatNumber(_.reduce(data.y[index], util.sum));
        },

        positionRelativeSumRendererFactory = function(position) {
            return function(d) {
                return formatNumber(data.y[position][d.seriesIndex]);
            };
        };

        return {
            reset: reset,
            amountRendererForTooltip: amountRendererForTooltip,
            yearlySumRenderer: yearlySumRenderer,
            positionRelativeSumRendererFactory: positionRelativeSumRendererFactory,
            amountRendererForAxis: amountRendererForAxis
        };
    };

    var timeAxis = function(parent, renderSums, numberFormat) {
        var data, scale, pos;

        var mainAxis = d3.svg.axis().orient("bottom").ticks(d3.time.year, 1),
            subAxis = d3.svg.axis().orient("bottom").ticks(d3.time.year, 1)
                .tickFormat(numberFormat.yearlySumRenderer), 

            textPadding = { top: 40 };

        var container = parent.append("g").attr("class", "axis-x"),
            mainAxisEl = container.append("g").attr("class", "axis-x-main"), 
            subAxisEl;
        
        if(renderSums) {
            subAxisEl = container.append("g").attr("class", "axis-x-support");
        }


        var reset = function(newData, newScale, newPos) {
                data = newData; scale = newScale; pos = newPos;
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

    var grid = function(base) {
        var _export, width, height, horzScale, vertScale, vertTicks, axes = { horizontal: false, vertical: false }, tickAmount;

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

        vert = function(scale, ticks) {
            vertScale = scale;
            vertTicks = ticks;
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
            }, "vert", vertScale)(vertTicks || vertScale.ticks(d3.time.year, 1));
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
            .attr("id", util.randomId())
            .offset(offset || [0,0])
            .direction(direction || "n")
            .html(renderer),
            applyDefaultListeners = defaultListeners != null ? defaultListeners:true;

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


    var window_ = function(data, range) {
        return {
            series: data.series,
            x: Array.prototype.slice.apply(data.x, range),
            y: Array.prototype.slice.apply(data.y, range),
        };
    };

    return {
        window_: window_,
        positionalUtils: positionalUtils,
        tooltips: tooltips,
        grid: grid,
        timeAxis: timeAxis,
        paddedTimeScale: paddedTimeScale,
        numberFormat: numberFormat
    };

});
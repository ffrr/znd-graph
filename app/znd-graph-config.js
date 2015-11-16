"use strict";
define("znd-graph-config", ["d3", "lodash"], function(d3, _) {
    return {
    	// todo: deflect "Ostatné" key to white
        colors: d3.scale.ordinal().range(_.map([
            "00d4ff", "ff92d7", "ffc900", "00c367", "ada9ff", "fff300",
            "ff4dd8", "007cff", "ff8600", "00acd5", "ff4d00", "00d21d",
            "b97aff", "00deb9", "c7344f"
        ], function(s) { return d3.rgb("#" + s); })),

        spritesPath: "system/svg/sprite.svg"
    };
});

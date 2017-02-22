define("znd-graph-locale", function() {
  var localeMap = {
    "bar.title": "Úspešnosť firmy v tendroch za jednotlivé roky",
    "timeline.title": "Účinkovanie osoby vo firmách v jednotlivých rokoch",
    "filter.grouping-aggregate": "Ostatné",
    "controls.less": "Zobraziť menej",
    "controls.more": "Zobraziť viac",
    "tick.thousands": "tis.",
    "tick.millions": "mil.",
    "tick.billions": "mld."
  };
  return function(id) {
    return localeMap[id] || "n/a"; 
  }
});

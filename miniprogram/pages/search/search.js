var util = require("../../utils/pages.js");

Page({
  data: {
    q: "",
    results: [],
    searched: false,
    secTitles: {}
  },
  onLoad: function () {
    var index = util.getIndex();
    var map = {};
    index.sections.forEach(function (s) {
      map[s.num] = s.title;
    });
    this.index = index;
    this.setData({ secTitles: map });
  },
  onInput: function (e) {
    this.doSearch(e.detail.value);
  },
  onClear: function () {
    this.doSearch("");
  },
  doSearch: function (q) {
    q = (q || "").trim();
    if (!q) {
      this.setData({ q: "", results: [], searched: false });
      return;
    }
    var terms = q.split(/\s+/).filter(Boolean);
    var map = this.data.secTitles;
    var arr = this.index.search;
    var results = [];
    for (var i = 0; i < arr.length && results.length < 100; i++) {
      var it = arr[i];
      var hay = it[2] + " " + (map[it[0]] || "");
      var ok = true;
      for (var j = 0; j < terms.length; j++) {
        if (hay.indexOf(terms[j]) < 0) {
          ok = false;
          break;
        }
      }
      if (ok) {
        results.push({
          sec: it[0],
          entry: it[1],
          title: it[2],
          evidence: it[3],
          benefit: it[4],
          scope: it[5],
          secTitle: map[it[0]] || ""
        });
      }
    }
    this.setData({ q: q, results: results, searched: true });
  },
  onTap: function (e) {
    var ds = e.currentTarget.dataset;
    util.navEntry(ds.sec, ds.entry);
  }
});

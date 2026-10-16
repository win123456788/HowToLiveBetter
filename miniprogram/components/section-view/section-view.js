var rich = require("../../utils/rich.js");
var pagesUtil = require("../../utils/pages.js");

var BENEFIT_KEY = { "大": "big", "中": "mid", "小": "small" };

Component({
  properties: {
    section: { type: Object, value: null },
    detailBase: { type: String, value: "" }
  },
  data: {
    introSegs: [],
    filterEv: "",
    filterBenefit: "",
    showAllIntro: false,
    list: [],
    counts: { A: 0, B: 0, C: 0 }
  },
  observers: {
    section: function (section) {
      if (!section) {
        return;
      }
      var self = this;
      var introSegs = (section.intro || []).map(function (p) {
        return { segs: rich.segment(p, section.num) };
      });
      var counts = { A: 0, B: 0, C: 0 };
      section.entries.forEach(function (e) {
        if (counts[e.evidence] !== undefined) {
          counts[e.evidence]++;
        }
      });
      this.setData({ introSegs: introSegs, counts: counts, showAllIntro: false });
      self.applyFilter();
    },
    "filterEv, filterBenefit": function () {
      this.applyFilter();
    }
  },
  methods: {
    applyFilter: function () {
      var s = this.properties.section;
      if (!s) {
        return;
      }
      var fe = this.data.filterEv;
      var fb = this.data.filterBenefit;
      var list = [];
      s.entries.forEach(function (e) {
        var tags = e.tags || {};
        if (fe && e.evidence !== fe) {
          return;
        }
        if (fb && tags["收益"] !== fb) {
          return;
        }
        var plain = e.plain || "";
        list.push({
          num: e.num,
          title: e.title,
          evidence: e.evidence,
          benefit: tags["收益"] || "",
          benefitKey: BENEFIT_KEY[tags["收益"]] || "",
          scope: tags["口径"] || "",
          snippet: plain.length > 90 ? plain.slice(0, 90) + "…" : plain,
          disputed: e.disputed
        });
      });
      this.setData({ list: list });
    },
    setEv: function (e) {
      this.setData({ filterEv: e.currentTarget.dataset.v });
    },
    setBenefit: function (e) {
      this.setData({ filterBenefit: e.currentTarget.dataset.v });
    },
    toggleIntro: function () {
      this.setData({ showAllIntro: !this.data.showAllIntro });
    },
    onEntryTap: function (e) {
      var num = e.currentTarget.dataset.entry;
      wx.navigateTo({
        url: this.data.detailBase + "?sec=" + this.properties.section.num + "&entry=" + num
      });
    },
    onRefTap: function (e) {
      var ds = e.currentTarget.dataset;
      if (ds.entry) {
        pagesUtil.navEntry(ds.sec, ds.entry);
      } else {
        pagesUtil.navSection(ds.sec);
      }
    }
  }
});

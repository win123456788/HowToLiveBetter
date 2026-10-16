var rich = require("../../utils/rich.js");
var pagesUtil = require("../../utils/pages.js");
var store = require("../../utils/store.js");

var FIELD_META = [
  { key: "cost", label: "成本" },
  { key: "plain", label: "说人话" },
  { key: "benefit", label: "收益" },
  { key: "source", label: "来源", noRef: true },
  { key: "note", label: "备注" }
];

Component({
  properties: {
    entry: { type: Object, value: null },
    secNum: { type: Number, value: 0 },
    secTitle: { type: String, value: "" },
    pkg: { type: String, value: "" }
  },
  data: {
    fields: [],
    tagList: [],
    costBits: [],
    fav: false
  },
  observers: {
    entry: function (entry) {
      if (!entry) {
        return;
      }
      var sec = this.properties.secNum;
      var fields = [];
      FIELD_META.forEach(function (meta) {
        var text = entry[meta.key] || "";
        if (text) {
          fields.push({
            key: meta.key,
            label: meta.label,
            segs: meta.noRef ? [{ t: "text", v: text }] : rich.segment(text, sec)
          });
        }
      });
      var tags = entry.tags || {};
      var tagList = [];
      if (tags["口径"]) {
        tagList.push("换回 " + tags["口径"]);
      }
      if (tags["收益"]) {
        tagList.push("收益 " + tags["收益"]);
      }
      var costBits = [];
      if (tags["钱"] !== undefined) {
        costBits.push("钱 " + tags["钱"]);
      }
      if (tags["时间"] !== undefined) {
        costBits.push("时间 " + tags["时间"]);
      }
      if (tags["毅力"] !== undefined) {
        costBits.push("毅力 " + tags["毅力"]);
      }
      this.setData({
        fields: fields,
        tagList: tagList,
        costBits: costBits,
        fav: store.isFav(sec, entry.num)
      });
    }
  },
  methods: {
    onRefTap: function (e) {
      var ds = e.currentTarget.dataset;
      if (ds.entry) {
        pagesUtil.navEntry(ds.sec, ds.entry);
      } else {
        pagesUtil.navSection(ds.sec);
      }
    },
    toggleFav: function () {
      var entry = this.properties.entry;
      var sec = this.properties.secNum;
      if (!entry || !sec) {
        return;
      }
      var added = store.toggle({
        sec: sec,
        entry: entry.num,
        pkg: this.properties.pkg,
        title: entry.title,
        secTitle: this.properties.secTitle,
        evidence: entry.evidence,
        plain: entry.plain || "",
        addedAt: Date.now()
      });
      this.setData({ fav: added });
      wx.showToast({ title: added ? "已收藏" : "已取消收藏", icon: "none" });
    },
    copySource: function () {
      var entry = this.properties.entry;
      if (!entry || !entry.source) {
        return;
      }
      wx.setClipboardData({ data: entry.source });
    }
  }
});

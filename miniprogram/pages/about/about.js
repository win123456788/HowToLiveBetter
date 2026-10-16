var util = require("../../utils/pages.js");

Page({
  data: {
    generatedAt: "",
    total: 0,
    upstream: ""
  },
  onLoad: function () {
    var index = util.getIndex();
    this.setData({
      generatedAt: index.generatedAt,
      total: index.search.length,
      upstream: index.upstream
    });
  },
  copyUpstream: function () {
    wx.setClipboardData({ data: this.data.upstream });
  },
  copyLicense: function () {
    wx.setClipboardData({ data: "https://creativecommons.org/licenses/by/4.0/" });
  }
});

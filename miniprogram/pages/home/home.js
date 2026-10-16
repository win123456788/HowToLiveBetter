var util = require("../../utils/pages.js");
var store = require("../../utils/store.js");

Page({
  data: {
    sections: [],
    total: 0,
    generatedAt: "",
    favCount: 0
  },
  onLoad: function () {
    var index = util.getIndex();
    this.setData({
      sections: index.sections,
      total: index.search.length,
      generatedAt: index.generatedAt
    });
  },
  onShow: function () {
    this.setData({ favCount: store.count() });
  },
  goSearch: function () {
    wx.navigateTo({ url: "/pages/search/search" });
  },
  goFavorites: function () {
    wx.navigateTo({ url: "/pages/favorites/favorites" });
  },
  goAbout: function () {
    wx.navigateTo({ url: "/pages/about/about" });
  },
  onSectionTap: function (e) {
    util.navSection(e.currentTarget.dataset.num);
  },
  onRandomTap: function () {
    var search = util.getIndex().search;
    var item = search[Math.floor(Math.random() * search.length)];
    util.navEntry(item[0], item[1]);
  }
});

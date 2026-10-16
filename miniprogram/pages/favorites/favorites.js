var store = require("../../utils/store.js");
var util = require("../../utils/pages.js");

Page({
  data: {
    list: []
  },
  onShow: function () {
    this.setData({ list: store.all() });
  },
  onTap: function (e) {
    var ds = e.currentTarget.dataset;
    util.navEntry(ds.sec, ds.entry);
  },
  onRemove: function (e) {
    var ds = e.currentTarget.dataset;
    var self = this;
    wx.showModal({
      title: "取消收藏",
      content: "确定从收藏里移除这条建议吗？",
      success: function (res) {
        if (res.confirm) {
          store.remove(ds.sec, ds.entry);
          self.setData({ list: store.all() });
        }
      }
    });
  }
});

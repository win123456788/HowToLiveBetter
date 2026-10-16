/**
 * 条目详情页工厂：分包里的 detail 页面用它生成 Page 配置。
 */

function buildDetailPage(dataMap) {
  return {
    data: {
      entry: null,
      secNum: 0,
      secTitle: "",
      pkg: ""
    },
    onLoad: function (query) {
      var sec = parseInt(query.sec, 10) || 0;
      var entryNum = parseInt(query.entry, 10) || 0;
      var section = dataMap[sec];
      if (!section) {
        wx.showToast({ title: "章节不存在", icon: "none" });
        return;
      }
      var entry = null;
      for (var i = 0; i < section.entries.length; i++) {
        if (section.entries[i].num === entryNum) {
          entry = section.entries[i];
          break;
        }
      }
      if (!entry) {
        wx.showToast({ title: "条目不存在", icon: "none" });
        return;
      }
      var pages = getCurrentPages();
      var route = (pages[pages.length - 1].route || "");
      var pkg = route.indexOf("/") >= 0 ? route.split("/")[0] : "";
      this.setData({
        entry: entry,
        secNum: sec,
        secTitle: section.title,
        pkg: pkg
      });
      wx.setNavigationBarTitle({ title: entry.title });
    },
    onShareAppMessage: function () {
      var e = this.data.entry;
      return { title: e ? e.title : "高性价比人生指南" };
    }
  };
}

module.exports = { buildDetailPage: buildDetailPage };

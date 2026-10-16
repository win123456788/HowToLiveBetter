/**
 * 章节页工厂：分包里的 section 页面用它生成 Page 配置。
 * 页面自身的分包位置从路由里推断，因此每个分包的壳文件可以完全一样。
 */

function buildSectionPage(dataMap) {
  return {
    data: {
      section: null,
      detailBase: ""
    },
    onLoad: function (query) {
      var num = parseInt(query.num, 10) || 0;
      var section = dataMap[num];
      if (!section) {
        wx.showToast({ title: "章节不存在", icon: "none" });
        return;
      }
      var pages = getCurrentPages();
      var route = (pages[pages.length - 1].route || "");
      var pkg = route.indexOf("/") >= 0 ? route.split("/")[0] : "";
      this.setData({
        section: section,
        detailBase: pkg ? "/" + pkg + "/pages/detail/detail" : ""
      });
      wx.setNavigationBarTitle({ title: "第 " + num + " 节 · " + section.title });
    },
    onShareAppMessage: function () {
      var s = this.data.section;
      return { title: s ? "高性价比人生指南 · " + s.title : "高性价比人生指南" };
    }
  };
}

module.exports = { buildSectionPage: buildSectionPage };

/**
 * 导航工具：按章节号找到它所在的分包，再跳过去。
 */

function getIndex() {
  var app = getApp();
  if (!app.globalData.index) {
    app.globalData.index = require("../data/index.js");
  }
  return app.globalData.index;
}

function getPkgMap() {
  var app = getApp();
  if (!app.globalData.pkgMap) {
    var map = {};
    var sections = getIndex().sections;
    for (var i = 0; i < sections.length; i++) {
      map[sections[i].num] = sections[i].pkg;
    }
    app.globalData.pkgMap = map;
  }
  return app.globalData.pkgMap;
}

function navSection(num) {
  var pkg = getPkgMap()[num];
  if (!pkg) {
    wx.showToast({ title: "章节不存在", icon: "none" });
    return;
  }
  wx.navigateTo({ url: "/" + pkg + "/pages/section/section?num=" + num });
}

function navEntry(sec, entry) {
  var pkg = getPkgMap()[sec];
  if (!pkg) {
    wx.showToast({ title: "章节不存在", icon: "none" });
    return;
  }
  wx.navigateTo({ url: "/" + pkg + "/pages/detail/detail?sec=" + sec + "&entry=" + entry });
}

module.exports = {
  getIndex: getIndex,
  getPkgMap: getPkgMap,
  navSection: navSection,
  navEntry: navEntry
};

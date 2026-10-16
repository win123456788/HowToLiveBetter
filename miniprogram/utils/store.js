/**
 * 收藏：存在本地 Storage 里，快照式保存，不依赖章节数据。
 */

var KEY = "fav_entries_v1";

function all() {
  return wx.getStorageSync(KEY) || [];
}

function isFav(sec, entry) {
  var list = all();
  for (var i = 0; i < list.length; i++) {
    if (list[i].sec === sec && list[i].entry === entry) {
      return true;
    }
  }
  return false;
}

function toggle(item) {
  var list = all();
  var removed = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].sec === item.sec && list[i].entry === item.entry) {
      list.splice(i, 1);
      removed = true;
      break;
    }
  }
  if (!removed) {
    list.unshift(item);
  }
  wx.setStorageSync(KEY, list);
  return !removed;
}

function remove(sec, entry) {
  var list = all();
  var next = [];
  for (var i = 0; i < list.length; i++) {
    if (!(list[i].sec === sec && list[i].entry === entry)) {
      next.push(list[i]);
    }
  }
  wx.setStorageSync(KEY, next);
}

function count() {
  return all().length;
}

module.exports = {
  all: all,
  isFav: isFav,
  toggle: toggle,
  remove: remove,
  count: count
};

/**
 * 把正文里的交叉引用切成可点击片段。
 * 支持的写法（数字两侧允许有空格）：
 *   见第 X 节第 Y 条 / 第 X 节第 Y 条 / 本节第 Y 条 / 见第 Y 条 /
 *   见第 X 节 / （第 Y 条）/ (第 Y 条)
 * 返回片段数组：
 *   [{t:"text",v} | {t:"ref",v,sec,entry}]，entry 为 0 表示只指向某节。
 */

var REF_RE = /见第\s*(\d+)\s*节第\s*(\d+)\s*条|第\s*(\d+)\s*节第\s*(\d+)\s*条|本节第\s*(\d+)\s*条|见第\s*(\d+)\s*条|见第\s*(\d+)\s*节|（第\s*(\d+)\s*条）|\(第\s*(\d+)\s*条\)/g;

function segment(text, secNum) {
  if (!text) {
    return [];
  }
  var out = [];
  var last = 0;
  var m;
  REF_RE.lastIndex = 0;
  while ((m = REF_RE.exec(text)) !== null) {
    if (m.index > last) {
      out.push({ t: "text", v: text.slice(last, m.index) });
    }
    if (m[1] !== undefined) {
      out.push({ t: "ref", v: m[0], sec: parseInt(m[1], 10), entry: parseInt(m[2], 10) });
    } else if (m[3] !== undefined) {
      out.push({ t: "ref", v: m[0], sec: parseInt(m[3], 10), entry: parseInt(m[4], 10) });
    } else if (m[5] !== undefined) {
      out.push({ t: "ref", v: m[0], sec: secNum, entry: parseInt(m[5], 10) });
    } else if (m[6] !== undefined) {
      out.push({ t: "ref", v: m[0], sec: secNum, entry: parseInt(m[6], 10) });
    } else if (m[7] !== undefined) {
      out.push({ t: "ref", v: m[0], sec: parseInt(m[7], 10), entry: 0 });
    } else if (m[8] !== undefined) {
      out.push({ t: "ref", v: m[0], sec: secNum, entry: parseInt(m[8], 10) });
    } else {
      out.push({ t: "ref", v: m[0], sec: secNum, entry: parseInt(m[9], 10) });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    out.push({ t: "text", v: text.slice(last) });
  }
  return out;
}

module.exports = { segment: segment };

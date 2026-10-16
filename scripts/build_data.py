# -*- coding: utf-8 -*-
"""把上游《高性价比人生指南》的 Markdown 正文转换成微信小程序数据模块。

用法：
    python scripts/build_data.py

输入：
    content/HowToLiveBetter/book/*.md    上游克隆的正文
    content/HowToLiveBetter/COMMIT.txt   可选，同步时的上游 commit 号

输出（生成物，不要手改）：
    miniprogram/data/index.js            主包索引（章节目录 + 搜索索引）
    miniprogram/app.json                 小程序配置（分包随内容自动切分）
    miniprogram/pkgX/data/NN.js          各章完整数据
    miniprogram/pkgX/data/all.js         分包内章节的静态引用映射
    miniprogram/pkgX/pages/section/*     章节页薄壳（逻辑在主包 utils）
    miniprogram/pkgX/pages/detail/*      条目页薄壳（逻辑在主包 utils）

改内容加工逻辑就改这个脚本；小程序界面在 miniprogram/pages 和
miniprogram/components 里，由人工维护，本脚本不碰。
"""

import json
import re
import shutil
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "content" / "HowToLiveBetter" / "book"
OUT = ROOT / "miniprogram"
UPSTREAM_REPO = "https://github.com/eternity4719/HowToLiveBetter"
PACK_LIMIT = 1_600_000  # 单个分包数据上限（字节），微信单分包上限 2MB，留余量

SECTION_RE = re.compile(r"^#\s+(\d+)\.\s*(.+?)\s*$")
ENTRY_RE = re.compile(r"^###\s+(\d+)\.\s*(.+?)\s*$")
TAG_RE = re.compile(r"<!--\s*成本标签[:：]\s*(.*?)\s*-->")
PAIR_RE = re.compile(r"([^=\s]+)=([^\s]+)")
FIELD_RE = re.compile(r"^-\s*([^：:]+)[：:](.*)$")
ANGLE_LINK_RE = re.compile(r"<((?:https?|ftp)://[^>\s]+)>")
MD_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

FIELDS = {
    "成本": "cost",
    "说人话": "plain",
    "收益": "benefit",
    "证据等级": "evidence",
    "来源": "source",
    "备注": "note",
}

unknown_lines = []


def clean_text(text):
    if not text:
        return ""
    text = text.strip()

    def repl_md_link(m):
        label, url = m.group(1).strip(), m.group(2).strip()
        if url.endswith(".md") or "/blob/" in url:
            return label
        return "%s（%s）" % (label, url)

    text = MD_LINK_RE.sub(repl_md_link, text)
    text = ANGLE_LINK_RE.sub(r"\1", text)
    return text.strip()


def parse_entry(block, sec_num):
    m = ENTRY_RE.match(block[0])
    entry = {
        "num": int(m.group(1)),
        "title": m.group(2),
        "tags": {},
        "cost": "",
        "plain": "",
        "benefit": "",
        "evidence": "",
        "source": "",
        "note": "",
    }
    current = None
    for raw in block[1:]:
        line = raw.strip()
        if not line:
            continue
        tm = TAG_RE.search(line)
        if tm:
            for k, v in PAIR_RE.findall(tm.group(1)):
                entry["tags"][k] = v
            continue
        fm = FIELD_RE.match(line)
        if fm and fm.group(1).strip() in FIELDS:
            current = FIELDS[fm.group(1).strip()]
            entry[current] = fm.group(2).strip()
            continue
        if current:
            entry[current] += " " + line
        else:
            unknown_lines.append("[%02d-%d] %s" % (sec_num, entry["num"], line[:80]))

    for key in ("cost", "plain", "benefit", "source", "note"):
        entry[key] = clean_text(entry[key])
    em = re.search(r"[ABC]", entry["evidence"])
    entry["evidence"] = em.group(0) if em else ""
    entry["disputed"] = "争议" in entry["note"]
    entry["todo"] = "TODO" in entry["note"] or "待核实" in entry["note"]
    if not entry["tags"]:
        unknown_lines.append("[%02d-%d] 缺少成本标签" % (sec_num, entry["num"]))
    return entry


def parse_section(path):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    h1_idx = None
    for i, line in enumerate(lines):
        if SECTION_RE.match(line.strip()):
            h1_idx = i
            break
    if h1_idx is None:
        raise ValueError("找不到章节标题: %s" % path.name)
    m = SECTION_RE.match(lines[h1_idx].strip())
    sec_num, sec_title = int(m.group(1)), m.group(2)

    intro_paras = []
    entries = []
    block = None
    for raw in lines[h1_idx + 1:]:
        line = raw.rstrip()
        if ENTRY_RE.match(line.strip()):
            if block:
                entries.append(parse_entry(block, sec_num))
            block = [line.strip()]
            continue
        if block is None:
            if line.strip():
                intro_paras.append(line.strip())
        else:
            block.append(line)
    if block:
        entries.append(parse_entry(block, sec_num))

    intro = [clean_text(p) for p in intro_paras]
    nums = [e["num"] for e in entries]
    if nums != list(range(1, len(nums) + 1)):
        unknown_lines.append("[%02d] 条号不连续: %s..." % (sec_num, nums[:10]))

    return {
        "num": sec_num,
        "title": sec_title,
        "intro": intro,
        "entries": entries,
    }


def js_module(obj_text):
    return "module.exports = %s;\n" % obj_text


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


SECTION_JS = (
    "// 自动生成，请勿手改：见 scripts/build_data.py\n"
    "var dataMap = require('../../data/all.js');\n"
    "var factory = require('../../../utils/section-page.js');\n"
    "Page(factory.buildSectionPage(dataMap));\n"
)

DETAIL_JS = (
    "// 自动生成，请勿手改：见 scripts/build_data.py\n"
    "var dataMap = require('../../data/all.js');\n"
    "var factory = require('../../../utils/detail-page.js');\n"
    "Page(factory.buildDetailPage(dataMap));\n"
)

SECTION_JSON = json.dumps({
    "navigationBarTitleText": "章节",
    "usingComponents": {
        "section-view": "/components/section-view/section-view",
    },
}, ensure_ascii=False, indent=2)

DETAIL_JSON = json.dumps({
    "navigationBarTitleText": "条目",
    "usingComponents": {
        "entry-view": "/components/entry-view/entry-view",
    },
}, ensure_ascii=False, indent=2)

SECTION_WXML = '<section-view section="{{section}}" detail-base="{{detailBase}}" />\n'
DETAIL_WXML = '<entry-view entry="{{entry}}" sec-num="{{secNum}}" sec-title="{{secTitle}}" pkg="{{pkg}}" />\n'
EMPTY_WXSS = "/* 自动生成，样式在主包 app.wxss 和组件里 */\n"


def write_app_json(pack_names):
    app_json = {
        "pages": [
            "pages/home/home",
            "pages/search/search",
            "pages/favorites/favorites",
            "pages/about/about",
        ],
        "subPackages": [
            {"root": name, "pages": ["pages/section/section", "pages/detail/detail"]}
            for name in pack_names
        ],
        "preloadRule": {
            "pages/home/home": {
                "network": "all",
                "packages": list(pack_names),
            }
        },
        "window": {
            "navigationBarBackgroundColor": "#f6f5f1",
            "navigationBarTextStyle": "black",
            "navigationBarTitleText": "高性价比人生指南",
            "backgroundColor": "#f6f5f1",
            "backgroundTextStyle": "dark",
        },
        "style": "v2",
        "lazyCodeLoading": "requiredComponents",
        "sitemapLocation": "sitemap.json",
    }
    (OUT / "app.json").write_text(
        json.dumps(app_json, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_pkg_pages(name):
    for page, js, j, wxml in (
        ("section", SECTION_JS, SECTION_JSON, SECTION_WXML),
        ("detail", DETAIL_JS, DETAIL_JSON, DETAIL_WXML),
    ):
        pdir = OUT / name / "pages" / page
        pdir.mkdir(parents=True, exist_ok=True)
        (pdir / (page + ".js")).write_text(js, encoding="utf-8")
        (pdir / (page + ".json")).write_text(j + "\n", encoding="utf-8")
        (pdir / (page + ".wxml")).write_text(wxml, encoding="utf-8")
        (pdir / (page + ".wxss")).write_text(EMPTY_WXSS, encoding="utf-8")


def main():
    if not SRC.is_dir():
        sys.exit("找不到正文目录: %s" % SRC)

    files = sorted(SRC.glob("*.md"), key=lambda p: int(p.name.split("-")[0]))
    if not files:
        sys.exit("正文目录里没有 .md 文件")

    sections = [parse_section(p) for p in files]
    total_entries = sum(len(s["entries"]) for s in sections)
    print("解析完成: %d 章, %d 条" % (len(sections), total_entries))

    upstream_commit = ""
    commit_file = ROOT / "content" / "HowToLiveBetter" / "COMMIT.txt"
    if commit_file.is_file():
        upstream_commit = commit_file.read_text(encoding="utf-8").strip()

    # 生成每章数据模块文本，按体积切分分包
    sec_texts = {}
    for s in sections:
        sec_texts[s["num"]] = js_module(dump(s))

    packs, cur, cur_size = [], [], 0
    for s in sections:
        size = len(sec_texts[s["num"]].encode("utf-8"))
        if cur and cur_size + size > PACK_LIMIT:
            packs.append(cur)
            cur, cur_size = [], 0
        cur.append(s["num"])
        cur_size += size
    if cur:
        packs.append(cur)

    pack_names = ["pkg%s" % chr(ord("A") + i) for i in range(len(packs))]
    pkg_of = {}
    for name, nums in zip(pack_names, packs):
        for n in nums:
            pkg_of[n] = name

    # 清理旧分包目录（分包数量变化时避免残留）
    for p in OUT.glob("pkg*"):
        if p.is_dir() and p.name not in pack_names:
            shutil.rmtree(p)

    data_dir = OUT / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    (data_dir / "index.js").write_text(
        js_module(dump({
            "generatedAt": date.today().isoformat(),
            "upstream": UPSTREAM_REPO,
            "upstreamCommit": upstream_commit,
            "sections": [{
                "num": s["num"],
                "title": s["title"],
                "count": len(s["entries"]),
                "pkg": pkg_of[s["num"]],
                "evidence": {
                    "A": sum(1 for e in s["entries"] if e["evidence"] == "A"),
                    "B": sum(1 for e in s["entries"] if e["evidence"] == "B"),
                    "C": sum(1 for e in s["entries"] if e["evidence"] == "C"),
                },
            } for s in sections],
            "search": [[s["num"], e["num"], e["title"], e["evidence"],
                        e["tags"].get("收益", ""), e["tags"].get("口径", "")]
                       for s in sections for e in s["entries"]],
        })),
        encoding="utf-8")

    print("主包索引: %.1f KB" % ((data_dir / "index.js").stat().st_size / 1024))

    for name, nums in zip(pack_names, packs):
        pdir = OUT / name / "data"
        pdir.mkdir(parents=True, exist_ok=True)
        mapping = {}
        size = 0
        for n in nums:
            fname = "%02d.js" % n
            (pdir / fname).write_text(sec_texts[n], encoding="utf-8")
            size += len(sec_texts[n].encode("utf-8"))
            mapping[n] = "./%s" % fname
        (pdir / "all.js").write_text(
            "// 自动生成：章节编号 -> 数据模块\nmodule.exports = {%s};\n" % ",".join(
                "%d:require('%s')" % (n, mapping[n]) for n in nums),
            encoding="utf-8")
        write_pkg_pages(name)
        print("分包 %s: 第 %d-%d 节, 数据 %.0f KB" % (name, nums[0], nums[-1], size / 1024))

    write_app_json(pack_names)
    print("已生成 app.json（%d 个分包）" % len(pack_names))

    if unknown_lines:
        print("\n注意：发现 %d 处未识别的行（已按续行处理）：" % len(unknown_lines))
        for line in unknown_lines[:30]:
            print("  " + line)
    else:
        print("\n没有未识别的行。")


if __name__ == "__main__":
    main()

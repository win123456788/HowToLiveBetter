# 高性价比人生指南 · 微信小程序（非官方阅读版）

把开源书[《高性价比人生指南》](https://github.com/eternity4719/HowToLiveBetter)装进微信小程序的独立第三方项目。

- **内容**：34 节、765 条建议，每条含成本、收益、证据等级（A/B/C）、原始文献出处
- **功能**：章节浏览、按证据/收益筛选、标题搜索、收藏、正文交叉引用点击跳转、「随便看一条」
- **离线可用**：全部数据打进小程序包，无需后端、无需网络请求
- **自动同步**：GitHub Actions 每天拉上游正文并重建数据，自动提交

## 目录结构

```
content/HowToLiveBetter/   上游正文快照（book/*.md，由同步流程更新）
scripts/build_data.py      Markdown → 小程序数据（Python 3.8+，零依赖）
miniprogram/               微信原生小程序（自研界面）
├── pages/                 主包页面：首页 / 搜索 / 收藏 / 关于
├── components/            核心视图组件：章节列表、条目详情
├── utils/                 引用切分、导航、收藏、页面工厂
├── data/index.js          生成的：章节目录 + 搜索索引（主包）
├── app.json               生成的：分包配置
└── pkgA/ pkgB/            生成的：各章数据 + 薄壳页面
.github/workflows/sync.yml 上游内容自动同步
```

## 本地跑起来

1. 克隆本仓库
2. 生成数据（可选，仓库里已包含生成结果）：
   ```
   python scripts/build_data.py
   ```
3. 打开微信开发者工具 → 导入项目 → 选择 `miniprogram/` 目录
4. 把 `miniprogram/project.config.json` 里的 `appid` 换成你自己的小程序 appid（没有就先用测试号）
5. 点「编译」即可预览

## 内容更新

手动：重新克隆上游正文覆盖 `content/HowToLiveBetter/book/`，再跑一次 `python scripts/build_data.py`。

自动：推送到 GitHub 后，`sync.yml` 每天自动拉上游、重建数据并提交（也可以去 Actions 页手动触发）。首次使用需要在仓库设置里给 Actions 打开写权限（Settings → Actions → General → Workflow permissions → Read and write）。

## 发布到微信

1. 到[微信公众平台](https://mp.weixin.qq.com/)注册小程序（个人主体可用），设置小程序名称
2. 把 appid 填进 `project.config.json`，开发者工具里「上传」
3. 在公众平台提交审核。注意：本项目内容涉及医疗、法律、理财建议，审核可能较严，建议先提交看反馈；「关于」页已写明非官方与免责声明

## 关键设计

- **分包策略**：数据按体积自动切成若干分包（`scripts/build_data.py` 里的 `PACK_LIMIT`，默认 1.6MB，微信单包上限 2MB），`app.json` 随内容自动生成
- **薄壳页面**：`pkgA/`、`pkgB/` 里的页面是生成出来的几行薄壳，界面逻辑集中在主包的 `components/`（可复用、好维护）
- **交叉引用**：正文里「见第 X 节第 Y 条」「（第 N 条）」等被切成可点击片段，实现见 `utils/rich.js`
- **不要手改生成物**：`miniprogram/app.json`、`miniprogram/data/`、`miniprogram/pkg*/`、`content/` 均由脚本/同步流程生成；要改行为请改 `build_data.py` 或主包代码
- **换小程序名字**：改 `pages/home/home.wxml` 的标题、`build_data.py` 里 app.json 模板的 `navigationBarTitleText`、以及公众平台里的名称

## 许可与署名

- **内容**：[《高性价比人生指南》](https://github.com/eternity4719/HowToLiveBetter)（作者 eternity4719），[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。本仓库对原文做了格式转换（Markdown → 结构化数据），未改动文字内容
- **代码**：MIT，见 LICENSE-CODE
- 本项目为非官方项目，内容可能滞后于原书，以原仓库中文原文为准；原作者从未发行任何代币，本项目同样不会

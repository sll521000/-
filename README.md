# 麒麟个人入口站 v0.3

静态个人网站，纯 HTML + CSS + 原生 JS（无构建、无依赖、无框架）。  
数据存浏览器 **localStorage**，每个模块支持导出 / 导入 JSON。  
部署到 Vercel / Netlify / GitHub Pages 一键可用。

## 文件清单

```text
index.html        主入口 — Hero / 四大入口 / About / Now / Projects / Stack / Contact / Changelog
growth.html       Entry 01 · 成长复盘（每周复盘 / 学习笔记 / 行动记录 / 阶段总结）
resources.html    Entry 02 · 资源共享（AI 工具 / 学习资源 / 效率模板 / 实用链接）
ai.html           Entry 03 · AI 聚合 × 万物联合（我的网站 / Roadmap）
contact.html      Entry 04 · 联系我（微信 / 更多渠道）
404.html          走丢了页面 — 全品牌设计
favicon.svg       站点图标（SVG 自适应）
og-image.svg      社交分享图（Open Graph / Twitter Card）
styles.css        全站样式 · Design Token 体系
README.md         你正在读的这个
.gitignore        排除测试残留 / 系统垃圾
sitemap.xml       SEO 站点地图
robots.txt        搜索引擎指令
site.webmanifest  PWA 元信息
```

## 主页七大区块

1. **Hero** — 头像 / 名字 / 角色 / 状态条 / CTA / 版本气泡
2. **四大入口** — 跳到子页面
3. **About** — 一段自述 + 4 个 stat 卡片
4. **Now** — Derek Sivers 风格的"我在做什么"清单
5. **Projects** — 项目卡片
6. **Stack** — 我用什么的工具清单
7. **Contact** — 一键复制微信
8. **Changelog** — 每次改动的版本日志（当前 v0.3）

## 当前版本：v0.3

### v0.3 升级要点

- ✅ 完整设计 token 体系（色板 · 间距 · 字号 · 圆角 · 阴影 · 动效曲线）
- ✅ **Noto Serif SC + Cormorant Garamond** 做标题，Inter 做正文
- ✅ **About · Now · Projects · Stack** 四个新板块
- ✅ 主导航 sticky + **scroll-spy** 高亮当前 section
- ✅ 渐变徽标 + 卡片磁性 hover + 入场 reveal
- ✅ **完整 SEO**：OG / Twitter Card / canonical / JSON-LD Person
- ✅ **完整 a11y**：skip-link · focus-visible · aria · reduced-motion
- ✅ **Modal 表单**替代 prompt 弹窗（更精细的输入体验）
- ✅ **404.html** · favicon.svg · og-image.svg · sitemap.xml · robots.txt · site.webmanifest
- ✅ **Back-to-top** 浮动按钮 · **Toast** 反馈 · **节流的滚动监听**

### v0.2 子页面

4 个独立子页面，每条数据可增删改，可导出 JSON。

### v0.1 首发

入口站骨架 + 微信复制 + Changelog。

## 本地预览

```bash
cd C:/Users/14360/WorkBuddy/个人网站
python -m http.server 5173
# 打开 http://localhost:5173
```

或者直接双击 `index.html` 用浏览器打开。

## 数据存储

| 模块 | localStorage key |
|---|---|
| 每周复盘 | `qilin.growth.weekly` |
| 学习笔记 | `qilin.growth.study` |
| 行动记录 | `qilin.growth.actions` |
| 阶段总结 | `qilin.growth.summary` |
| AI 工具 | `qilin.res.tools` |
| 学习资源 | `qilin.res.study` |
| 效率模板 | `qilin.res.templates` |
| 实用链接 | `qilin.res.links` |
| 我的网站 | `qilin.ai.projects` |
| 更多联系方式 | `qilin.contact.more` |

**不跨设备**（这是 localStorage 的天然限制）。  
每个子页面都有"导出 JSON"按钮做备份，下次需要时"导入"覆盖。

## 部署

```bash
cd "C:/Users/14360/WorkBuddy/个人网站"
git add .
git commit -m "v0.3: 设计语言升级 — token 体系 + 4 个新区块 + Modal 编辑 + 完整 SEO"
git push origin main
```

Vercel 监听 main 分支，30-60s 自动部署。

## 下一步可以做的

1. 头像：放 `images/avatar.jpg`，把 hero 那段 `<div class="avatar-placeholder">麒</div>` 换成 `<img>`
2. 二维码：放 `images/wechat-qr.jpg`，替换 contact 页的 SVG 占位
3. 暗色主题：加一组 `--bg` 等的 dark token + `[data-theme="dark"]` 切换器
4. 数据上云：升级到 Vercel KV / Supabase + 一致的 `qilin.*` 命名空间
5. RSS / 订阅：把 changelog 部分抽出做 feed

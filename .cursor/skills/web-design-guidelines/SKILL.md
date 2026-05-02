---
name: web-design-guidelines
description: >-
  Applies Tempo WebView (Vue 3 + Vite) UI/UX conventions—semantic markup,
  CSS variables, accessibility, responsive layout, and performance hygiene.
  Use when editing web/src, building Vue pages/components, styling web CSS,
  or when the user mentions web UI, WebView content, or browser-facing design.
---

# Web 设计准则（Tempo `web/`）

## 范围

仅针对 **`web/`** 内嵌 Vue 页面（产品形态：RN 壳 + WebView）。原生壳见 **`frontend-design`** 与规则 **`.cursor/rules/figma-design-system.mdc`**。

## 样式与主题

- 颜色与排版优先 **`web/src/style.css`** 里 `:root` 的 **`var(--*)`**；暗色跟随已有的 **`prefers-color-scheme`** 变量；避免在模板或 scoped 样式里随意新增与 token 无关的硬编码色值。
- 扩展主题时先补变量与语义化类，再在组件内引用。
- 布局用弹性/网格与一致间距节奏（如 4/8px 基数），避免零散 magic number。

## 结构与语义

- 使用语义化 HTML（`main`、`nav`、`button`、`label` 与标题层级）；交互控件可被键盘聚焦，`label` 与表单控件关联。
- 不要在 **`service/`** 中实现 UI（仓库约定）。

## 可访问性与呈现

- 对比度满足可读性；不要仅靠颜色传达状态（辅以文案或图标）。
- 图片与图标提供有意义的 **`alt`** / **`aria-*`**（装饰性可隐藏）。
- 尊重 **`prefers-reduced-motion`**（若有动画，提供减弱或关闭路径）。

## 与 RN 壳的边界

- WebView 内勿依赖仅 RN 可用的 API；配置依赖 **`window.__TEMPO_CONFIG__`** 与开发兜底 **`import.meta.env`**（见 `App.vue`）。

## 性能与工程

- 按需拆分组件；避免在热点路径上不必要的大依赖。
- 遵循 monorepo：**pnpm**、与仓库一致的脚本；改动后可用 **`pnpm --filter web build`** 做类型与构建校验。

## 交叉引用

- Figma 落地与双端分工：**`.cursor/rules/figma-design-system.mdc`**
- 实现层面的视觉与交互打磨：**`frontend-design`** skill

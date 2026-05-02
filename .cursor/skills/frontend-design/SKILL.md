---
name: frontend-design
description: >-
  Implements polished, cohesive Tempo UI across Expo RN shell and Vue WebView:
  layout, typography, spacing, states, and Figma alignment. Use when building
  or refactoring screens/components in app/ or web/, improving visual quality,
  or when the user mentions UI polish, design implementation, or frontend design.
---

# 前端界面实现（Tempo）

## 先读仓库约定

- **双端分工**：RN 壳 `app/` vs WebView `web/` — 详见 **`.cursor/rules/figma-design-system.mdc`**；勿混用仅一端可用的 API 或样式假设。
- **Web 细化**：布局、a11y、CSS 变量与 WebView 边界见 **`web-design-guidelines`** skill。

## 通用原则

- **视觉层次**：主标题 / 副文案 / 辅助信息层级清晰；间距与字重支撑扫描而非堆砌。
- **节奏**：间距与圆角在同一屏幕内保持一致尺度；新样式优先对齐设计 token，其次对齐邻近模块。
- **状态**：加载、空列表、错误需有明确 UI；禁用态与进行中态可区分。
- **触控与点击域**：RN 上保证足够触控面积；Web 上按钮与链接有清晰 hover/focus 样式。

## RN 壳（`app/`）

- 屏幕放 **`app/modules/<domain>/`**；默认导出函数组件；路由与 **`routes`** 在 **`app/core/navigation/`**。
- 布局优先 **`SafeAreaView`**；全屏装饰可参考现有 **`LinearGradient`** / **`BlurView`** 用法。
- 样式用 **`StyleSheet.create`**，置于文件底部；组件 PascalCase；屏幕命名 **`*Screen.tsx`**。
- 时间与持久化展示遵循 **`.cursor/rules/datetime-ms-source-of-truth.mdc`**（毫秒真源、展示层格式化）。

## Web 内嵌（`web/`）

- Vue 3 **`script setup lang="ts`** + SFC；主题色与排版走 **`style.css`** 变量（见 **web-design-guidelines**）。

## Figma 与设计稿

- 1:1 或迭代对齐时：设计变量与组件映射优先；复杂画布写入前先读 **figma-use** 再调用 **`use_figma`**（若已启用 Figma MCP）。
- Code Connect 与映射文件放在仓库约定路径，便于设计—代码双向对齐。

## 交付前自检（按需）

- [ ] 双端是否落在正确包（未把 Web 样式写进 RN，反之亦然）
- [ ] 主题变量 / RN StyleSheet 是否与邻近界面一致
- [ ] 交互状态与无障碍是否覆盖主要路径
- [ ] 相关包 **`tsc`** / 构建是否仍通过

# Tempo App — 全原生模块与主导航设计（单仓竖切）

**日期：** 2026-05-02  
**仓库根路径：** `~/Documents/project/private/tempo`  
**状态：** 待你评审通过后，作为实现与拆任务（`writing-plans`）的依据  

---

## 1. 背景与目标

### 1.1 背景

- 仓库内 `app` 当前为 **Expo + WebView** 壳（见历史 spec `2026-04-30-tempo-design.md`）。
- 本轮方向（已选 **方案 C**）：**各业务域尽量在 React Native 内实现**，以贴合 Figma（开屏品宣、登录、日程、资产、「我」等），不再以 H5 为主载体。
- **工程定位**：个人项目；采用 **单仓 Modular Monolith（严约束竖切）**，不引入多 package 的过重拆分，除非后续规模强制需要。

### 1.2 目标

- 用 **`modules/*` 竖切**业务，模块间 **禁止互相 import**。
- **路由名称、路径、URL scheme** 在 **`core/navigation`** 内 **单点定义**（`routes` + `linking`）。
- 主导航为 **底部 Tab**：**日程**、**资产**、**我**（中文展示文案；目录与代码标识为英文模块名）。
- **设置** 不设顶层模块：当前归属 **`modules/user`**，未来若「设置」只是一个子区域，仍不独立为顶层 `modules`，避免与产品 IA 重复。

### 1.3 非目标（本 spec 不展开实现细节）

- 具体 UI 还原粒度、动效参数（以 Figma 为准，实现阶段再定）。
- 后端协议、推送 payload 结构（仅在「路由集中」前提下预留 deep link 入口）。
- WebView 是否完全移除：本设计以 **原生主导航 + 原生 Tab** 为准；若个别页面临时 WebView，须在壳层注册路由，**路径仍走 `core/navigation`**。

---

## 2. 模块清单与职责

| 用户可见域（概念） | 目录 | 职责 |
|--------------------|------|------|
| 开屏品宣 | `modules/splash` | 品牌展示、停留/淡出策略；结束后将控制权交回根导航；仅依赖 `shared/theme`、`core/navigation` 的导航意图（由壳执行）。 |
| 登录 | `modules/login` | 登录流程与子屏；对接 `core/session`，不引用 `schedule` / `finance` / `user`。 |
| 日程（Tab） | `modules/schedule` | 日程相关列表/详情/编辑等。 |
| 资产（Tab） | `modules/finance` | 资产/金融相关列表与详情等（与日程零横向依赖）。 |
| 我（Tab） | `modules/user` | 「我」聚合页；**设置入口与设置子页放在本模块内**（当前与规划一致）。 |

**共享与内核（示例名，实现时可微调文件名）：**

- `shared/ui`：通用组件（依赖 theme tokens，不依赖业务模块）。
- `shared/theme`：设计 token、`ThemeProvider`；品宣/campaign 的可切换资源与 token 覆盖策略。
- `core/session`：登录态单一实现；对外暴露 `useSession()` 等；各 `modules/*` 不得互相读对方状态。
- `core/navigation`：`routes.ts`（路由名与类型）、`linking.ts`（`prefixes` + `config`），**唯一真源**。

---

## 3. 导航与用户路径

### 3.1 启动顺序（逻辑）

1. `Splash`（`modules/splash`）展示品宣。
2. 根壳根据 **`core/session`**：**未登录** → `Auth` 流（主要由 `modules/login` 构成）；**已登录** → `MainTabs`。

### 3.2 主容器：`MainTabs`

- **Tab 1 — 日程**：根路由指向 `modules/schedule` 的默认 Screen（栈由该模块内部或壳层薄包装，二选一，实现阶段定，但 **path 只在 `core/navigation` 登记**）。
- **Tab 2 — 资产**：`modules/finance`。
- **Tab 3 — 我**：`modules/user`（含设置子路由；设置 **不作为** 第四个 Tab）。

Tab **展示文案**（中文）：日程、资产、我。  
Tab **技术标识** 与目录一致：`schedule`、`finance`、`user`。

### 3.3 集中式路由与 Deep Link

- 所有 **Screen 注册** 时使用的 **name、嵌套路径、可选 query 约定** 从 `core/navigation/routes.ts` 导出。
- **URL scheme** 与通用 **https `prefixes`**（若将来做 universal link）仅在 `core/navigation/linking.ts` 配置一次。
- **禁止** 在 `modules/*` 内硬编码 `tempo://...` 或重复 path 片段。

---

## 4. 依赖规则（强制执行含义）

1. `modules/<A>` **不得** `import` `modules/<B>`（A ≠ B）。
2. 允许依赖：`shared/*`、`core/*`、React/React Native、经壳层注入的导航回调类型（若采用）。
3. 跨模块「协作」优先：**根壳** 组合路由与 Tab；**`core/session`** 统一门禁与刷新；若极少数场景需广播，再评估 **`core/events`**（默认 YAGNI，不预先实现）。

建议在 CI/本地启用 **ESLint `import/no-restricted-paths`**（或等价规则）约束 `modules/*` 互引。

---

## 5. 主题与品宣

- **`shared/theme`** 提供 tokens 与 `ThemeProvider`。
- **Campaign / 品宣**：通过「主题 id + 资源映射」在启动或壳层初始化时选定；各业务模块只消费 `useTheme()`，不直接依赖其他模块内的 PNG/文案。
- **`modules/splash`** 可消费当前 campaign 资源；导航跳转 **不** 直接触碰 `finance`/`schedule` 内部实现。

---

## 6. 与既有 `WebView` 壳的关系（迁移备注）

- 当前 `App.tsx` 为 WebView 全屏 + 原生开屏 overlay。迁到本设计后：**主导航与 Tab 为原生**；若个别 URL 仍需 WebView，应以 **单一 Screen** 形式挂在 **原生 Stack** 下，且 **linking 目标仍登记在 `core/navigation`**。
- **配置注入**（如 `__TEMPO_CONFIG__`）若仍需要，应由壳在 **WebView Screen** 维持，不分散到各业务模块。

---

## 7. 自审清单（占位扫描）

- [x] 模块命名：`login`、`schedule`、`finance`、`user`、`splash`；**英文目录名**。
- [x] 「设置」归属 **`modules/user`**，无顶层 `modules/settings`。
- [x] Tab 三个：**日程 / 资产 / 我**。
- [x] 路由与 URL scheme：**`core/navigation` 单点**。
- [x] 个人项目：**单仓竖切**，不强制 workspace 多包。

---

## 8. 待实现阶段再定的单点（避免过度设计）

- `MainTabs` 内各 Tab 是「单屏」还是「Tab 内再套 Stack」：按 Figma 信息架构与返回行为在 `writing-plans`/首个 PR 中定稿。
- 认证 token 存储介质（SecureStore 等）与刷新策略：归属 `core/session`，本 spec 只要求 **单实现**。

---

**下一步：** 你确认本文无歧义后，使用 **writing-plans** 技能产出可执行的实现计划（含目录落地顺序、依赖安装如 `@react-navigation/*`、从当前 WebView `App.tsx` 迁移的最小步骤）。

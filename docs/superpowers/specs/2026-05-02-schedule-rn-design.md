# Tempo — 日程板块（RN）设计说明

**日期：** 2026-05-02  
**状态：** 已冻结产品与技术决策（实现前若变更须更新本文）  
**范围：** Expo `app/` 内原生日程 Tab + 通知收件箱；**不包含** WebView 内日程页。

**架构补充（按选中日聚合列表、Service 契约、横滑换日、语音确认前不落库）：** 见 [`2026-05-02-schedule-platform-design.md`](./2026-05-02-schedule-platform-design.md)。

---

## 1. 目标与非目标

### 1.1 目标

- 按 Figma 高还原度实现 **日程首页**（全屏 `8111:3433`、视口 `8204:3164`）与 **通知**相关界面（`8111:3850`、`8111:3912`、空状态 `8111:3945`）。
- **设计令牌**先行：`light` 语义主题 + Figma 变量源（`1:181`），预留 dark / XX 模式扩展点，**当前仅实现 light**。
- **Manrope** 为强制 UI 字体（须打包/加载成功后再渲染关键界面）。
- **react-native-paper** 仅用于 **List / Appbar / Dialog** 等样板-heavy 区域，日程核心视觉（时间轴、卡片、日期条等）**手写**，以保证还原度（**方案 C：混合**）。
- **国际化**：文案抽离 **i18n**，**默认语言英文**。
- **日程数据**：持久化在 **用户本地**（见 §5）。
- **微交互**：日期选中、卡片按压、列表滚动等与稿一致的轻量动效（不显式引入重型动画库除非必要）。
- **图标**：SVG 优先（`react-native-svg`）。

### 1.2 非目标（本阶段不做）

- 真实后端对接、账号同步、多端推送通道。
- Web 端日程实现。
- 设计稿右上角「+」添加日程交互（后续迭代）。
- 日程卡片点击进入详情页 — **仅 Toast「敬请期待」**（文案走 i18n）。
- 夜间模式视觉成品（仅 token 结构预留）。

---

## 2. 已确认决策摘要

| 主题 | 决策 |
|------|------|
| 消息 vs 通知 | **统一为「通知」**；入口仍为 **铃铛**；**单一屏幕内 Segment** 切换两类视图（与 Figma 两个面板对应，语义均属通知）。 |
| 数据 | **仅 Mock + 本地持久化**；无远程 API。 |
| 主题 | **Token 铺全 + 仅 light 生效**。 |
| 字体 | **强制 Manrope**。 |
| 组件库 | **Paper** 收窄用于 List / Appbar / Dialog 等；其余原生 + StyleSheet + token。 |
| 卡片点击 | **Toast「敬请期待」**。 |
| 架构取向 | **混合方案 C**，优先 **设计稿还原度**。 |

---

## 3. 补充需求（本轮新增）

1. **微交互**：如日期选中态过渡、按压反馈（opacity / scale 适度）、列表滚动与顶部协调等；避免影响首屏性能。
2. **i18n**：默认 **en**；键名语义化；日后增中文只需加 locale 文件。
3. **本地存储**：用户日程数据落地本地，App 重启后仍可读取；Mock 数据可作为初始种子写入。

---

## 4. 信息架构与导航

- **Main Tab「日程」**：由单层 Screen 升级为 **`Schedule` 内嵌 Native Stack**（与 `User` Tab 嵌 Stack 一致）。
- **路由示例（命名待 `routes.ts` 落地）**  
  - `ScheduleHome` — 日程主界面（日期条 + Upcoming / Finished）。  
  - `NotificationInbox` — 铃铛进入；**顶部 Appbar + Segment**；下方列表；空状态同屏替换。
- **深层链接**：可在 `linking.ts` 预留 `notifications` path（非必须首版完成）。

---

## 5. 数据层与本地持久化

### 5.1 抽象

- **`ScheduleRepository`**（接口）：`listByDay`、`listFinished`、`upsert`（Mock 阶段可用于演示）、`observe` / 订阅或刷新回调。
- **实现**：首版 **Mock 实现 + AsyncStorage（或等价）** 持久化 JSON；结构稳定后可换 SQLite **无需改 UI**。

### 5.2 建议存储形态

- Key：`tempo.schedule.v2`（命名空间版本化）。  
- 内容：`ScheduleItem[]`（含 `id`、`title`、`start`、`end`、`tag`、`status`、`attendees` 等与设计一致的字段）。

### 5.3 Mock

- 内置少量与设计稿文案对齐的 **英文** seed（与默认语言一致）；首次启动写入存储。

---

## 6. 设计令牌（Theme）

- **来源对齐**：Figma `1:181` 变量集合 → `app/core/theme/tokens.ts`（或同名模块）定义原始值；`semantic.ts` 映射 `background.primary`、`text.secondary`、`brand.primary`、`schedule.card.upcoming`、`schedule.card.done` 等。
- **`ThemeProvider`**：自定义 Context，向下传递 `tokens` + `paperTheme`（由 token 映射生成 Paper 的 `MD3LightTheme` 覆盖色与圆角）。
- **暗色**：文件中保留 `dark` 占位类型或空对象，**不接线**。

---

## 7. react-native-paper 使用边界

- **使用**：`Appbar.Header`、`List.Section` / `List.Item`、`Divider`、`Dialog`、`Portal`、`Snackbar`（若 Toast 统一用 Paper）或 `react-native` Toast API — **择一并写入实现计划**。
- **不使用**：Paper `Card` 替换自绘日程卡片（除非内部试验证明可 1:1 还原）。

---

## 8. 字体

- **`expo-font`** + **@expo-google-fonts/manrope**（或官方推荐载体）在根组件一次性 `loadAsync`，**Splash / 阻塞 UI** 直至就绪或降级策略（实现计划写明）。
- Paper `fonts` 配置与 `Text` 默认 fontFamily 对齐 Manrope。

---

## 9. 国际化

- 推荐 **`i18next` + `react-i18next` + `expo-localization`**（或等价），`fallbackLng: 'en'`。
- 命名空间：`common`、`schedule`、`notifications`。
- **通知 Segment 标签**、**空状态**、**Toast**、**区块标题**（Upcoming / Finished）全部走文案键。

---

## 10. 通知收件箱（Segment）

- **单一铃铛入口** → `NotificationInbox`。
- **Segment**：两段切换，**对应 Figma 两套列表视觉**（原「消息」「通知」稿件合并为通知频道的两类：**命名以英文化稿为准**，建议在 i18n 中配置 `notifications.segment.primary` / `notifications.segment.secondary`，具体字面在实现时对照 MCP 导出或设计标注）。
- **空状态**：独立组件，对齐 `8111:3945`。

---

## 11. 模块与目录（建议）

```
app/
  core/
    theme/           # tokens, ThemeProvider, paper bridge
    i18n/            # config, locales/en.json (+ zh 预留)
    storage/         # schedule persistence helpers
  modules/
    schedule/
      screens/       # ScheduleHomeScreen, NotificationInboxScreen
      components/    # DateStrip, Timeline, ScheduleCard, EmptyNotifications
      hooks/
      repo/          # ScheduleRepository, mock, storage
```

高内聚：日程仅依赖 `core/theme`、`core/i18n`、`core/storage` 的公开 API。

---

## 12. 依赖变更（实现阶段安装）

- `react-native-paper`
- `react-native-safe-area-context`（已有）
- `react-native-svg`
- `@react-native-async-storage/async-storage`（若未随 Expo 内置则添加）
- `i18next`、`react-i18next`、`expo-localization`
- `@expo-google-fonts/manrope` + `expo-font`
- （可选）`react-native-reanimated` — **仅当微交互无法用 LayoutAnimation / Pressable 满足时再引入**（实现计划评估）。

---

## 13. 测试与验收（概要）

- Repository：纯函数与序列化单测。
- 关键 UI：快照或少量组件测试（可选）。
- 手动：**英文**环境下对照 Figma 关键间距与字号；离线杀进程后日程仍在。

---

## 14. 下游

实现前使用 **writing-plans** 技能生成任务拆解（依赖安装 → theme/i18n → 导航 → 屏幕 → 持久化 → 抛光）。

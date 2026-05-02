# 日程板块（Expo RN）— Figma 节点索引

**规格来源：** [`docs/superpowers/specs/2026-05-02-schedule-rn-design.md`](../superpowers/specs/2026-05-02-schedule-rn-design.md)  
**实施计划（含 MCP 对照步骤）：** [`docs/superpowers/plans/2026-05-02-schedule-rn-implementation.md`](../superpowers/plans/2026-05-02-schedule-rn-implementation.md)

**Figma 文件：** [`日程`](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B) · **fileKey：** `EvZSYclUAsOszMPa0boDDj`

下文「官方链接」为对话中提供的 **完整 URL**（含 `node-id` 等参数），可直接点击或复制使用。

---

## 整体项目入口

| 说明 | 链接 |
|------|------|
| 整体项目参考（节点 `8142:3275`） | [在 Figma 中打开](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8142-3275&t=nc0Mi4p8KtcfY42i-0) |

> 若链接失效，请核对 Figma 是否移动文件；`fileKey` 仍为 `EvZSYclUAsOszMPa0boDDj`。

---

## 节点直达链接（官方）

| # | 说明 | 节点 | 打开 |
|---|------|------|------|
| 1 | 设计令牌 / 变量封装来源 | `1:181` → `1-181` | [在 Figma 中打开](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=1-181) |
| 2 | 日程板块 — **全屏**呈现 | `8111:3433` | [在 Figma 中打开](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8111-3433&t=nc0Mi4p8KtcfY42i-4) |
| 3 | 日程板块 — **视口**呈现 | `8204:3164` | [在 Figma 中打开](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8204-3164&t=nc0Mi4p8KtcfY42i-4) |
| 4 | 日程右上角 — **消息**板块 | `8111:3850` | [在 Figma 中打开](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8111-3850&t=nc0Mi4p8KtcfY42i-4) |
| 5 | 日程右上角 — **通知**板块 | `8111:3912` | [在 Figma 中打开](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8111-3912&t=nc0Mi4p8KtcfY42i-4) |
| 6 | **消息为空**时的展示 | `8111:3945` | [在 Figma 中打开](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8111-3945&t=nc0Mi4p8KtcfY42i-4) |
| 7 | **日程列表**（左侧时间轴 + 卡片列） | `8142:3182` | [在 Figma 中打开](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8142-3182&t=nc0Mi4p8KtcfY42i-4) |
| 8 | **整页 Light Mode**（画布入口，含导航/日期条/列表） | `6257:11094` | [在 Figma 中打开](https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=6257-11094) |

**MCP：** Cursor **`user-figma`** → `get_metadata` / `get_design_context`（`fileKey`=`EvZSYclUAsOszMPa0boDDj`）。`get_design_context` 可返回参考代码与 **7 日内有效**的资源 URL；**Figma Starter** 可能对 MCP 调用次数有限制，超限需升级计划或在桌面端选中图层后再试。列表节点 `8142:3182` 内可见 `CalendarDots`、`CheckCircle`、`SpinnerGap` 等子节点，可与 RN 矢量组件对齐。

**复制用（纯文本）：**

```text
https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8142-3275&t=nc0Mi4p8KtcfY42i-0
https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=1-181
https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8111-3433&t=nc0Mi4p8KtcfY42i-4
https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8204-3164&t=nc0Mi4p8KtcfY42i-4
https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8111-3850&t=nc0Mi4p8KtcfY42i-4
https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8111-3912&t=nc0Mi4p8KtcfY42i-4
https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8111-3945&t=nc0Mi4p8KtcfY42i-4
https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=8142-3182&t=nc0Mi4p8KtcfY42i-4
https://www.figma.com/design/EvZSYclUAsOszMPa0boDDj/%E6%97%A5%E7%A8%8B?node-id=6257-11094
```

---

## 节点对照表（与实现对齐）

| 节点 ID（Figma） | `node-id`（URL） | 大意 | 实现侧对应 |
|------------------|------------------|------|------------|
| `8142:3275` | `8142-3275` | 整体项目参考帧 | 信息架构 / 总览 |
| `8111:3433` | `8111-3433` | 日程 — **全屏** | `ScheduleHomeScreen` 整体布局 |
| `8204:3164` | `8204-3164` | 日程 — **视口** | 安全区 / 滚动视口间距 |
| `8111:3850` | `8111-3850` | 右上角 **消息**面板 | `NotificationInbox` Segment 一侧 |
| `8111:3912` | `8111-3912` | 右上角 **通知**面板 | Segment 另一侧 |
| `8111:3945` | `8111-3945` | **空状态** | `NotificationEmptyState` |
| `8142:3182` | `8142-3182` | **列表**：左侧时间轴（卡片外）+ 卡片列 | `ScheduleDayPage`：`ScheduleTimelineRail` + `ScheduleCard` |
| `6257:11094` | `6257-11094` | **Light Mode** 整页画布 | 总览；子节点含日期条、图标实例（如 `CalendarDots`、`CheckCircle`） |
| `1:181` | `1-181` | 设计令牌 / 变量 | `app/core/theme/tokens.ts`、`semantic.ts` |

---

## 规格摘要（与节点关系）

- **日程首页**：全屏 `8111:3433`、视口 `8204:3164`；卡片与时间轴等为手写组件，Paper 不替代日程卡片本体。
- **铃铛入口**：收件箱内 Segment 两段对应 **消息** `8111:3850` 与 **通知** `8111:3912`（产品规格中语义可统称「通知」，视觉仍以稿为准）。
- **空状态：** `8111:3945`。
- **主题：** light；变量源 `1:181`。

---

## 验收提示

手动对照上述链接核对间距与字号；自动化可用 MCP（如 `get_design_context`）按节点拉取上下文。
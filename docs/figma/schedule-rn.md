# 日程板块（Expo RN）— Figma 节点索引

**规格来源：** [`docs/superpowers/specs/2026-05-02-schedule-rn-design.md`](../superpowers/specs/2026-05-02-schedule-rn-design.md)  
**实施计划（含 MCP 对照步骤）：** [`docs/superpowers/plans/2026-05-02-schedule-rn-implementation.md`](../superpowers/plans/2026-05-02-schedule-rn-implementation.md)

历史对话与规格中约定的设计稿节点大意如下（**未包含团队私有 `FILE_KEY`**，请用 Figma「复制链接」补全）。

---

## 节点对照表

| 节点 ID（Figma） | `node-id`（URL） | 大意 | 实现侧对应 |
|------------------|------------------|------|------------|
| `8111:3433` | `8111-3433` | 日程首页 — **全屏**构图 | `ScheduleHomeScreen`、日期条 + Today / Finished 整体布局 |
| `8204:3164` | `8204-3164` | 日程首页 — **视口**（viewport）构图 | 与安全区/滚动视口相关的间距与裁切对齐 |
| `8111:3850` | `8111-3850` | 通知相关界面（其一） | `NotificationInbox`：列表 / Segment 一侧视觉 |
| `8111:3912` | `8111-3912` | 通知相关界面（其二） | Segment 另一分类下的列表视觉（与 `3850` 成对对照） |
| `8111:3945` | `8111-3945` | **通知空状态** | `NotificationEmptyState` |
| `1:181` | `1-181` | **变量集合**（Design tokens / variables） | `app/core/theme/tokens.ts`、`semantic.ts` 数值溯源 |

---

## 直达链接模板

将 `<FILE_KEY>` 替换为本文件在 Figma 中的文件 ID：

```text
https://www.figma.com/design/<FILE_KEY>?node-id=8111-3433   # 日程首页（全屏）
https://www.figma.com/design/<FILE_KEY>?node-id=8204-3164   # 日程首页（视口）
https://www.figma.com/design/<FILE_KEY>?node-id=8111-3850   # 通知界面 A
https://www.figma.com/design/<FILE_KEY>?node-id=8111-3912   # 通知界面 B
https://www.figma.com/design/<FILE_KEY>?node-id=8111-3945   # 通知空状态
https://www.figma.com/design/<FILE_KEY>?node-id=1-181       # 变量 / Token 源
```

---

## 规格摘要（与节点关系）

- **日程首页**：高还原目标框在 `8111:3433`（全屏）与 `8204:3164`（视口）；实现以 token + 手写组件为主，Paper 不扛日程卡片本体。
- **通知**：单一铃铛进收件箱；**Segment 两段**对应两套列表视觉（`8111:3850` / `8111:3912`），语义上统称「通知」频道。
- **空状态**：对齐 `8111:3945`。
- **主题**：light only；变量对齐 `1:181`，dark 仅占位。

---

## 验收提示（来自实施计划）

手动验收时可对照上述节点核对 **间距与字号**；自动化拉稿可使用 MCP（如 `get_design_context`）针对表中节点批量导出上下文。

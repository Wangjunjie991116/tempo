# Schedule 平台缺口落地（2026-05-02）

依据：`docs/superpowers/specs/2026-05-02-schedule-platform-design.md`。

## Tasks

- [x] **Task A**：抽取 `calendarRange`（`stripCalendarBounds` / `enumerateDaysInclusive` / `indexOfSameDay` / `localDayKey` 等），`DateStrip` 与主页共用同一套「日序列」语义。
- [x] **Task B**：实现纯函数 `partitionScheduleForDay`，仓储 `listScheduleForDay` 单次读存储 + 分区；`listByDay` / `listFinishedByDay` 委托同一分区结果；Jest 覆盖边界。
- [x] **Task C**：`useScheduleAllItems` 一次加载全量；主页横向分页（`FlatList` + `pagingEnabled`）按 `days` 渲染；`DateStrip` 点击滚动 pager；pager `onMomentumScrollEnd` 回写选中曰并与条带联动。
- [ ] **Task D（后续）**：语音录入、`POST /parse`、条目级 `timezone` / `voice.rawText` 等与后端契约对齐（当前规格 §5–§6，未在本轮实现）。

## 验证

- `pnpm --filter app exec tsc --noEmit`
- `pnpm --filter app test`

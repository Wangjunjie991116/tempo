# Tempo — 日程平台化设计（客户端 + Service）

**日期：** 2026-05-02  
**状态：** 草案已定稿（架构优先、可替换既有草稿实现）  
**范围：** 按「选中某一天」划分 **未完成 / 已完成**；**日程与资产数据仅存用户设备本地**，保障隐私；**`tempo/service` 仅承担无状态能力（如自然语言解析）**，不落库、不查询用户日程；客户端 **`listScheduleForDay`** 为唯一分区语义；含日期横滑、时区、语音确认前不落库。

**关联：** 视觉与 RN 组件边界见 [`2026-05-02-schedule-rn-design.md`](./2026-05-02-schedule-rn-design.md)；Figma 链接见 [`docs/figma/schedule-rn.md`](../../figma/schedule-rn.md)。

---

## 1. 目标与非目标

### 1.1 目标

- **单日聚合查询（仅客户端）**：以 **`listScheduleForDay(anchorDay)`** 为权威语义，返回 `{ upcoming, finished }`，避免 UI 与仓储重复过滤。
- **「选中某日」定义**：用户选中日历上的某一天 **D（本地日历日）**。  
  - **未完成（upcoming）**：`status === upcoming` 且 **`startAt` 落在 D**（按设备本地日历解释 `startAt`；见 §6 时区）。  
  - **已完成（finished）**：`status === finished` 且 **`endAt` 落在 D**；若 **`endAt` 缺失**，则 **回退 `startAt` 落在 D**。
- **UI 文案**：上段区块固定为 **Upcoming**（对应未完成列表），下段为 **Finished**；**禁止**使用 **Today** / **TodaySchedule** 等暗示「永远是今天」的主标题；文案走 i18n（如 “Upcoming ({{count}})”）。
- **内置默认数据**：客户端 **`DEFAULT_SCHEDULE_ITEMS`**（`app/modules/schedule/repo/seed.ts`，固定 **6** 条 JSON）；**每次进程启动后首次 `loadScheduleItems` 覆盖写入** AsyncStorage，之后同会话内与普通持久化一致；锚定日历曰见 `docs/app-schedule-local-storage.md`。
- **日期切换**：支持 **横向滑动** 切换日历日（与日期条选中态双向同步）。
- **时区**：解析与展示支持 **IANA 时区**（设备变更、用户偏好、语音解析请求）。
- **语音**：调用 **`POST /api/v1/schedule/parse`**（可演进）；**用户确认前不得写入本地持久化数组**，仅内存草稿；确认后 **仅写入本地**。

### 1.2 非目标（本规格不强制）

- 服务端持久化用户日程或资产数据（隐私边界明确排除）。
- 生产级多端同步冲突合并 UI（字段可预留，接入方式另议）。
- 重复日程 RRULE 完整实现（可字段占位）。
- WebView 内日程页。

---

## 2. 客户端架构

### 2.1 仓储 API（推荐唯一入口）

```ts
listScheduleForDay(day: LocalCalendarDay): Promise<{ upcoming: ScheduleRecord[]; finished: ScheduleRecord[] }>
```

- `LocalCalendarDay`：实现上等价「本地午夜锚点的 `Date`」或 `{ year, month, day }`，团队择优统一。
- 内部实现：**单一分区函数** `partitionForDay(all: ScheduleRecord[], day)`，禁止在 UI 层复制过滤逻辑。

### 2.2 持久化

- **事实来源**：设备本地 JSON 数组（AsyncStorage 或后继 SQLite）。  
- **存储**：AsyncStorage 键 **`tempo.schedule`**（唯一键）；详见 [`docs/app-schedule-local-storage.md`](../../app-schedule-local-storage.md)。  
- **与服务的关系**：HTTP 仅用于 **解析等无状态调用**；**不向服务端上传完整日程库**，除非未来用户明确选择的新能力（不在本规格范围）。

### 2.3 UI：区块标题

| 区块 | 含义 | 推荐 i18n key（示例） |
|------|------|----------------------|
| 上段 | 选中日的未完成日程 | `schedule:sectionUpcoming`（例：“Upcoming ({{count}})”） |
| 下段 | 选中日的已完成日程 | `schedule:sectionFinished`（例：“Finished ({{count}})”） |

**禁止**作为主标题：**Today**、**TodaySchedule**（可选用中性副文案说明「当前选中日」，但不替代区块名）。

### 2.4 横滑换日

- 主内容区（列表区域）使用 **按日分页** 的横向滑动（如 `PagerView` / `FlatList` horizontal paging），每一页绑定一个 **日历日**。  
- **DateStrip**：与当前页 **双向同步**（滑动改页 → 更新选中；点击 strip → 滚动 pager）。  
- 性能：邻近日预加载可选；首版可对 ±7 日惰性绑定。

---

## 3. 领域模型：ScheduleRecord（客户端）

本地持久化实体；字段可与解析结果 **`ScheduleDraft`** 对齐，便于语音写入。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string (uuid) | ✓ | 客户端生成 |
| `title` | string | ✓ | |
| `tag` | enum | ✓ | `design_review` \| `workshop` \| `brainstorm`（可扩展） |
| `start_at` | string (ISO 8601) | ✓ | 含偏移或 Z；展示按 §6 |
| `end_at` | string (ISO 8601) | | 未完成可为空；已完成建议有 |
| `all_day` | boolean | ✓ | 默认 `false` |
| `status` | enum | ✓ | `upcoming` \| `finished` |
| `attendee_count` | number | ✓ | UI 用 |
| `attendee_overflow` | number | | 可选 |
| `notes` | string | | |
| `timezone` | string | | IANA；语音/解析写入 |
| `source` | enum | ✓ | `manual` \| `voice` \| `import` |
| `parse_confidence` | number | | 0–1，来自解析接口 |
| `created_at` | string | ✓ | ISO |
| `updated_at` | string | ✓ | ISO |
| `deleted_at` | string \| null | | 软删 |

可选预留（当前不接服务端日程存储，默认不用）：`server_id` — 仅当未来存在「用户显式同意的同步/导出」时再启用。

（TS 层可用 camelCase，落盘序列化约定团队统一即可。）

---

## 4. Service（tempo/service）：隐私边界与接口

### 4.1 原则

- **不存储**用户日程、资产等个人数据；**不提供**按用户拉取日程列表的 API。  
- **允许**：短时处理用户提交的 **片段文本**（如语音转写结果），返回 **结构化草稿**，由客户端确认后写入本地。

### 4.2 解析（保留并强化契约）

**`POST /api/v1/schedule/parse`**

请求：

```json
{
  "text": "string",
  "timezone": "Asia/Shanghai",
  "locale": "en-US"
}
```

响应 `data`：**ScheduleDraft**

| 字段 | 说明 |
|------|------|
| `title` | ✓ |
| `start_at` | ISO 或 null |
| `end_at` | ISO 或 null |
| `all_day` | boolean |
| `confidence` | float |
| `notes` | string \| null |

实现须避免记录可关联用户的明细日志（如需日志仅聚合 / traceId，与本仓储合规策略一致）。

**不提供**：~~`GET /api/v1/schedules/day`~~、`POST/PATCH/DELETE …/schedules` 等任何服务端日程 CRUD。

---

## 5. 语音流程（不落库直至确认）

```text
语音/文本 → POST /parse → 内存 Draft（可选 UI 编辑）→ 用户「确认」→ 仅写入本地持久化（append / upsert）
```

- **确认前**：不得写入本地持久化数组。  
- **取消**：丢弃 Draft。  
- **确认后**：`source: voice`，写入 `parse_confidence`、`timezone`、`notes` 等；`updated_at` 更新。

---

## 6. 时区

- **解析请求**须带 **`timezone`**（设备当前或用户设置）。  
- **每条记录**可存 **`timezone`**，用于展示与「自然日 D」边界一致。  
- **自然日边界**：仅在客户端 `partitionForDay` 实现中选择单一可信策略（库或自建 util），与 **`parse` 请求中的 timezone** 对齐说明写在实现计划中。

---

## 7. 内置默认日程（代码常量）

- **`DEFAULT_SCHEDULE_ITEMS`**：4 upcoming + 2 finished，写死在 `seed.ts`，ISO 锚定 **2026-05-02**。  
- **`loadScheduleItems`**：**每次 App 进程启动后的首次调用**一律将 **`DEFAULT_SCHEDULE_ITEMS`** 克隆写入 **`tempo.schedule`**（覆盖已有内容）；同进程内后续调用则读取当前存储（若为空则再写入默认）；本会话内的 **`saveScheduleItems`** 仍可落盘，但**下次冷启动**仍会被首次加载重置为默认。

---

## 8. 验收要点

- 切换任意一天：**Upcoming / Finished 两段均仅含该日**（§1.1）。  
- 横滑切换日：列表与 DateStrip 一致。  
- 语音：确认前无新本地持久化条目；确认后出现。  
- **服务端**：无日程存储与列表接口；仅 **`parse`** 可按契约返回草稿。  
- **内置默认**：**每次冷启动后首次加载**写入 **`DEFAULT_SCHEDULE_ITEMS`**（§7，覆盖已有）；选中日需覆盖锚定曰才有条目。

---

## 9. 自检（占位 / 一致性 / 范围 / 歧义）

- **已定**：客户端按曰过滤；**`DEFAULT_SCHEDULE_ITEMS`** 每次冷启动首次加载覆盖写入；Upcoming + Finished 文案；服务端 **不落库**；语音确认后本地写；横滑、时区。  
- **实现期须对齐**：自然日边界计算的单一实现源与测试向量（客户端单测即可）。

---

**下游：** 实施任务拆解见 **writing-plans**（RN 仓储分区、`PagerView`、i18n **`sectionUpcoming`**、`parse` 契约与合规注释；不包含服务端日程 CRUD）。

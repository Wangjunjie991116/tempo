# Tempo — 日程平台化设计（客户端 + Service）

**日期：** 2026-05-02  
**状态：** 草案已定稿（架构优先、可替换既有草稿实现）  
**范围：** 按「选中某一天」划分 **未完成 / 已完成**；本地持久化为事实来源（MVP）；**`tempo/service` 接口与字段**一并定义，便于语音解析与未来同步；含日期横滑、时区、语音确认前不落库。

**关联：** 视觉与 RN 组件边界见 [`2026-05-02-schedule-rn-design.md`](./2026-05-02-schedule-rn-design.md)；Figma 链接见 [`docs/figma/schedule-rn.md`](../../figma/schedule-rn.md)。

---

## 1. 目标与非目标

### 1.1 目标

- **单日聚合查询**：客户端与服务端均以 **`listScheduleForDay(anchorDay)`** 为权威语义，返回 `{ upcoming, finished }`，避免两套 filter 漂移。
- **「当天」定义**：用户选中日历上的某一天 **D（本地日历日）**。  
  - **未完成（upcoming）**：`status === upcoming` 且 **`startAt` 落在 D**（按设备本地日历 interpret `startAt`；见 §6 时区）。  
  - **已完成（finished）**：`status === finished` 且 **`endAt` 落在 D**；若 **`endAt` 缺失**，则 **回退 `startAt` 落在 D**。
- **UI 文案**：区块标题 **不出现「Today」**——两段列表均为「选中某日」的数据；命名采用 **状态维度**，与 **Finished** 对称（推荐：**Scheduled**（或 **Upcoming**） + **Finished**），具体英文字符串走 i18n。
- **演示数据**：首次空库时 seed：**选中逻辑上的「今天」**写入 **4 条未完成 + 2 条已完成**（时间字段满足 §1.1 归属规则）。
- **日期切换**：支持 **横向滑动** 切换日历日（与日期条选中态双向同步）。
- **时区**：解析与展示支持 **IANA 时区**（设备变更、用户偏好、语音解析请求）。
- **语音**：调用现有 **`POST /api/v1/schedule/parse`**（可演进）；**用户确认前不得写入持久化数组**，仅内存草稿。

### 1.2 非目标（本规格不强制）

- 生产级多端同步冲突合并 UI（字段预留即可）。
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

- **MVP**：设备本地 JSON 数组（可继续使用 AsyncStorage 或后继 SQLite）。  
- **存储版本**：建议使用 **`tempo.schedule.v2`**（或与团队约定的单一 key + `schemaVersion` 字段）；从 0 到 1 可直接 v2，不做历史迁移包袱。  
- 文档级约定：**数组元素类型** 与下文 **ScheduleRecord** / 服务端 **ScheduleResource** 对齐（ snake_case 仅在 HTTP JSON；客户端 TS 可用 camelCase + 边界映射）。

### 2.3 UI：区块标题

| 区块 | 含义 | 推荐 i18n key（示例） |
|------|------|----------------------|
| 上段 | 选中日的未完成日程 | `schedule:sectionScheduled`（文案如 “Scheduled ({{count}})”）或 `schedule:sectionUpcoming` |
| 下段 | 选中日的已完成日程 | `schedule:sectionFinished`（现有 Finished 语义延续） |

**禁止**使用暗示「永远是今天」的 **Today** 作为主标题（可选用副文案提示「相对自然日」但不混同区块名）。

### 2.4 横滑换日

- 主内容区（列表区域）使用 **按日分页** 的横向滑动（如 `PagerView` / `FlatList` horizontal paging），每一页绑定一个 **日历日**。  
- **DateStrip**：与当前页 **双向同步**（滑动改页 → 更新选中；点击 strip → 滚动 pager）。  
- 性能：邻近日预加载可选；首版可对 ±7 日惰性绑定。

---

## 3. 领域模型：ScheduleRecord（客户端）

与下文服务端 **`ScheduleResource`** 字段语义一致（命名在边界转换）。

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string (uuid) | ✓ | 客户端生成；服务端后续可映射 |
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
| `server_id` | string \| null | | 同步后回填 |
| `deleted_at` | string \| null | | 软删 |

（TS 层可用 camelCase，序列化到磁盘或 API 时统一约定。）

---

## 4. Service（tempo/service）接口与资源

### 4.1 解析（已有，保留并强化契约）

**`POST /api/v1/schedule/parse`**

请求（沿用并明确）：

```json
{
  "text": "string",
  "timezone": "Asia/Shanghai",
  "locale": "en-US"
}
```

响应 `data`：**ScheduleDraft**（可演进为与 ScheduleResource 子集对齐）：

| 字段 | 说明 |
|------|------|
| `title` | ✓ |
| `start_at` | ISO 或 null |
| `end_at` | ISO 或 null |
| `all_day` | boolean |
| `confidence` | float |
| `notes` | string \| null |

### 4.2 单日查询（新增，与客户端语义一致）

**`GET /api/v1/schedules/day`**

查询参数：

| 参数 | 必填 | 说明 |
|------|------|------|
| `date` | ✓ | `YYYY-MM-DD`，**参照日历日** |
| `timezone` | ✓ | IANA，用于解释「自然日」边界（与客户端选中一日对齐） |

响应：

```json
{
  "date": "2026-05-02",
  "timezone": "Asia/Shanghai",
  "upcoming": [ /* ScheduleResource[] */ ],
  "finished": [ /* ScheduleResource[] */ ]
}
```

**分区规则**：与 §1.1 完全一致（服务端实现须与客户端 `partitionForDay` 可对账）。

### 4.3 写入类（预留，MVP 可 stub）

- **`POST /api/v1/schedules`** — 创建  
- **`PATCH /api/v1/schedules/{id}`** — 部分更新（含 `status` → finished）  
- **`DELETE /api/v1/schedules/{id}`** — 软删（`deleted_at`）

**ScheduleResource**：与 §3 列表字段一致，外加服务端分配的 `id`（若与客户端 UUID 并存，约定 `server_id` / `id` 映射策略）。

---

## 5. 语音流程（不落库直至确认）

```text
语音/文本 → POST /parse → 内存 Draft（可选 UI 编辑）→ 用户「确认」→ POST /schedules 或仅本地 append（MVP 可无后端写入）
```

- **确认前**：不得调用持久化数组写入；不得在 AsyncStorage/SQLite 中追加正式记录。  
- **取消**：丢弃 Draft。  
- **确认后**：`source: voice`，写入 `parse_confidence`、`timezone`、`notes` 等；`updated_at` 更新。

---

## 6. 时区

- **解析请求**必须带 **`timezone`**（设备当前或用户设置）。  
- **每条记录**可存 **`timezone`**，用于跨区展示与「自然日 D」解释一致。  
- **GET `/schedules/day`** 的 `date` + `timezone` 定义窗口：服务端与客户端使用同一库或同一规则计算「日的起止 Instant」（规格实现阶段选定，禁止 silently 混用本地服务器时区）。

---

## 7. 演示数据（Seed）

- 触发条件：存储为空（或团队约定「开发重置」）。  
- 生成 **锚定「当前本地日历的今天」** 的 **4 upcoming + 2 finished**。  
- **finished** 的 `end_at`（或回退的 `start_at`）须落在该自然日；**upcoming** 的 `start_at` 落在该自然日。

---

## 8. 验收要点

- 切换任意一天：**两段列表仅含该日**（§1.1）。  
- 横滑切换日：列表与 DateStrip 一致。  
- 语音：确认前无新持久化条目；确认后出现。  
- Service：`GET /schedules/day` 与客户端分区结果一致（可对同一 fixture JSON 做契约测试）。

---

## 9. 自检（占位 / 一致性 / 范围 / 歧义）

- **已定**：方案 2（单日聚合 API）；Finished / Scheduled 均按选中日本地日过滤；服务端 CRUD 预留；语音不落库至确认；横滑、时区、seed 数量。  
- **实现期须选一**：`Scheduled` vs `Upcoming` 英文最终用词（不影响架构）。  
- **实现期须对齐**：「自然日」边界计算的单一实现源（库或自建 util），客户端与服务端共用测试向量。

---

**下游：** 用户审阅本文档通过后，使用 **writing-plans** 生成实施任务拆解（RN `PagerView`、仓储、`GET /schedules/day`、Pydantic 模型、i18n 键替换等）。

# Tempo 日程全栈 — 设计说明（MVP 竖切）

**日期：** 2026-04-30  
**仓库根路径：** `~/Documents/project/private/tempo`  
**状态：** 已通过 brainstorming 评审冻结（实现前请再确认本文无歧义）

---

## 1. 目标与非目标

### 1.1 目标（MVP 竖切）

- **端到端故事**：用户在 Web（嵌入 RN WebView）输入**自然语言一句** → **Python 后端 Mock 解析** → 返回结构化日程草稿 → **前端客户端持久化**并列表可见（提醒可先 Toast 或省略）。
- **工程形态**：**Expo** 壳 + **`react-native-webview`**；内嵌 **Vue 3 + Vite**（开发：本机/局域网 Vite URL；发布：远端静态资源 URL）。
- **后端**：**FastAPI**（`tempo/service`）；解析接口 **先 Mock**，流程稳定后在**同一路径与响应 envelope** 下接入真实 LLM（HTTP API，**密钥仅服务端**）。
- **持久化策略**：首版 **仅客户端存储**；接口与领域模型按**未来服务端入库**预留扩展点（仓储接口适配器）。
- **工具约束**：**pnpm**；**Node.js v24**（根 `package.json` 建议 `engines.node: ">=24"`，并配合 `.nvmrc`）。

### 1.2 非目标（本阶段不做或可占位）

- 账号体系、多设备同步、服务端数据库落地。
- 系统推送、完整提醒闭环、系统日历写入。
- 生产级监控、计费、复杂 LLM 编排（LangGraph 等可后置）。

---

## 2. 仓库与目录

首层平铺（与用户约定一致）：

```
tempo/
  app/           # Expo（RN 壳 + WebView）
  web/           # Vue 3 + Vite
  service/       # FastAPI（Python 3.11+，独立 pyproject/虚拟环境）
  docs/
    superpowers/
      specs/     # 本文件
```

- **pnpm workspace**：仅纳入 `app/` 与 `web/`；`service/` 为 Python，不参与 pnpm workspaces。
- **共享类型**：竖切跑通后再评估是否增加 `packages/shared`（YAGNI）。

---

## 3. 架构方案结论

经对比，采用 **单仓三应用（平铺目录）**：

- **优点**：竖切改动集中；Mock→LLM 仅替换 `service` 内部实现；与「开发期 Vite dev server、发布期远端静态」一致。
- **不推荐**：先只做浏览器再补 WebView（易踩存储/安全域差异）；或弱化 Vite dev URL（与已定稿冲突）。

---

## 4. 运行时与数据流

1. **启动**：`app` 启动 → `WebView` 加载 `WEB_BASE_URL`（来自环境变量，如 `EXPO_PUBLIC_WEB_BASE_URL`）。
2. **竖切路径**：Web 内输入文本 → `fetch` **`service`** 的 **`POST /api/v1/schedule/parse`** → 收到 envelope → 若 `code === 0`，将 **`data`（日程草稿）** 经 `ScheduleRepository` 写入 **localStorage** → UI 刷新列表。
3. **配置**：`API_BASE_URL` 建议由 RN **注入 WebView**（如 `window.__TEMPO_CONFIG__`）或与 Web **开发期 `web/.env.dev`（`vite --mode dev`）** 对齐，避免嵌入与浏览器直连两套分支失控。
4. **CORS**：`service` 为 Web 来源放开必要 origin（开发：Vite；生产：静态站点域名）。
5. **真机调试**：解析接口若使用 **HTTP + 局域网 IP**，需在 Expo/iOS 处理 **ATS（明文 HTTP）** 等例外；**生产环境对外接口应为 HTTPS**。

---

## 5. HTTP API 契约

### 5.1 路径与版本

- **解析**：`POST /api/v1/schedule/parse`

### 5.2 请求体（示例）

```json
{
  "text": "明天下午3点和老王开会一小时",
  "timezone": "Asia/Shanghai",
  "locale": "zh-CN"
}
```

字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `text` | string | 必填，用户自然语言 |
| `timezone` | string | 可选，IANA TZ，用于解析相对时间 |
| `locale` | string | 可选，如 `zh-CN` |

### 5.3 响应 envelope（强制）

**第一层固定四项：`code`、`msg`、`data`、`traceId`。**

- **`code`**：`number`，**`0` 表示成功；非 `0` 表示异常**。
- **`msg`**：`string`，人类可读说明（成功可为简短固定文案如 `ok`）。
- **`data`**：成功时为**日程草稿对象**（即原「draft」语义，嵌套在 `data` 内）；失败时可为 `null` 或与错误相关的结构化信息（本阶段建议 **`null`**，细节放 `msg`，避免客户端分支爆炸）。
- **`traceId`**：`string`，请求追踪 ID（服务端生成；日志与排障）。

**不显式包含 `schema_version` 字段**（与用户约定一致）。

### 5.4 `data` 日程草稿字段（成功时）

| 字段 | 类型 | 说明 |
|------|------|------|
| `title` | string | 标题 |
| `start_at` | string \| null | ISO 8601 UTC 或带偏移，若无法解析则为 null |
| `end_at` | string \| null | 同上 |
| `all_day` | boolean | 是否全天 |
| `confidence` | number | 可选，Mock 可固定 `0`；LLM 阶段填模型置信度 |
| `notes` | string \| null | 可选备注 |

成功响应示例：

```json
{
  "code": 0,
  "msg": "ok",
  "data": {
    "title": "和老王开会",
    "start_at": "2026-05-01T07:00:00.000Z",
    "end_at": "2026-05-01T08:00:00.000Z",
    "all_day": false,
    "confidence": 0,
    "notes": null
  },
  "traceId": "01JRXY..."
}
```

失败响应示例：

```json
{
  "code": 10001,
  "msg": "parse_failed",
  "data": null,
  "traceId": "01JRXY..."
}
```

### 5.5 Mock 与 LLM 演进

- **Mock 阶段**：返回符合上述形状的固定或规则生成结果；**路径与 envelope 不变**。
- **LLM 阶段**：仍使用 **`POST /api/v1/schedule/parse`**；实现替换为真实模型调用；**密钥仅存在于 `service` 环境**；可对 `msg` / 日志补充 provider 信息（不必单独字段，除非后续有需要）。

---

## 6. 各端职责

| 目录 | 职责 |
|------|------|
| **`app/`** | Expo；WebView；`EXPO_PUBLIC_WEB_BASE_URL`；向 Web 注入 `API_BASE_URL`（推荐）；处理开发期 ATS/网络安全配置。 |
| **`web/`** | Vue + Vite；解析调用；`ScheduleRepository`（首版 `LocalStorageAdapter`）；预留与服务端同步的适配器。 |
| **`service/`** | FastAPI；Mock 解析；Pydantic（或等价）模型与 envelope/`data` 对齐；CORS；`traceId` 中间件（轻量）。 |

---

## 7. 测试与演进顺序

1. **契约测试**：固定 `POST /api/v1/schedule/parse` 的成功/失败 envelope 快照，防止 Mock→LLM 切换破坏客户端。
2. **Web**：覆盖「成功写入存储」「`code !== 0` 提示」。
3. **`app/`**：竖切以手动 E2E 为主；自动化后续补。
4. **演进**：① 三端 Mock 打通；② 接入 LLM；③ 服务端持久化（新接口与仓储并行演进）。

---

## 8. 原文档章节映射（评审记录）

- §1 目标与非目标 → 本文第 1 节  
- §2 仓库目录 → 本文第 2 节  
- §3 方案对比结论 → 本文第 3 节  
- §4 运行时 → 本文第 4 节  
- §5 API（含 envelope 与 `/api/` 前缀修订）→ 本文第 5 节  
- §6 各端职责 → 本文第 6 节  
- §7 测试与演进 → 本文第 7 节  

---

## 9. Spec 自检摘要（2026-04-30）

- **占位符**：无 TBD。  
- **一致性**：`code !== 0` 与失败示例一致；`data` 承载草稿与 §4 运行时描述一致；路径含 `/api/`。  
- **范围**：单竖切 + 演进顺序明确，适合进入 implementation plan。  
- **歧义消除**：失败时 `data` 推荐 `null`，错误细节以 `msg` + `traceId` 为准。

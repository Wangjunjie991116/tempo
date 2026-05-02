# Tempo MVP 竖切 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `tempo/` 单仓内交付可运行的 Expo（WebView）+ Vue/Vite + FastAPI（Mock 解析）竖切：自然语言 → `POST /api/v1/schedule/parse` → `code===0` 时将 `data` 写入 Web 端 localStorage 并列表展示。

**Architecture:** 首层平铺 `app/`、`web/`、`service/`；pnpm workspace 仅绑定 JS 两端；Python 独立 `pyproject.toml`。契约严格遵循 `docs/superpowers/specs/2026-04-30-tempo-design.md` 的 envelope 与 `data` 草稿字段。

**Tech Stack:** Node **24** + **pnpm**；Expo（RN）+ `react-native-webview`；Vue 3 + Vite + TypeScript；FastAPI + Pydantic + **uv**（锁依赖）+ pytest；Vitest 测 Web 纯函数与仓储逻辑。

**前置：** 已读本计划与 design spec；机器已装 **Node 24**、**pnpm**、**Python 3.11+**、[**uv**](https://docs.astral.sh/uv/)。

---

## 文件映射（将创建/修改）

| 路径 | 职责 |
|------|------|
| `package.json` | 根 workspace 元数据、`engines`、聚合脚本（含 **`pnpm sync:lan-env`**、`pnpm dev` → `dev-iterm.sh`） |
| `pnpm-workspace.yaml` | workspace：`app`、`web` |
| `.nvmrc` | `24` |
| `.gitignore` | Node/Python/Expo 通用忽略（若已存在则合并） |
| `scripts/sync-dev-lan-env.sh` | 写入 **`web/.env.dev`** / **`app/.env.dev`** 局域网 URL（`pnpm sync:lan-env`；`pnpm dev` 前自动执行） |
| `scripts/dev-iterm.sh` | macOS iTerm2 三 Tab 启动 |
| `service/pyproject.toml` | FastAPI、uvicorn、pydantic、pytest、httpx |
| `service/app/main.py` | FastAPI 实例、CORS、`traceId` 中间件、路由挂载 |
| `service/app/schemas.py` | `ScheduleDraft`、`ApiEnvelope` |
| `service/app/routers/schedule.py` | `POST /api/v1/schedule/parse` |
| `service/app/services/mock_parse.py` | Mock 解析 |
| `service/tests/test_schedule_parse.py` | API 契约测试 |
| `web/` | `pnpm create vite` vue-ts 生成后再补 API/仓储/UI |
| `web/src/types/api.ts` | `ApiEnvelope`、`ScheduleDraft` TS 类型 |
| `web/src/api/parseSchedule.ts` | `fetch` 封装 |
| `web/src/repos/scheduleRepo.ts` | localStorage 读写 + 列表 |
| `web/src/App.vue` | 输入框、按钮、列表、错误提示 |
| `web/src/vite-env.d.ts` | `ImportMetaEnv` 补全 |
| `web/.env.dev` | `VITE_API_BASE_URL`（`vite --mode dev` 加载；`pnpm sync:lan-env` 可生成） |
| `web/src/repos/scheduleRepo.test.ts` | Vitest |
| `web/vitest.config.ts` | Vitest 配置 |
| `app/` | `pnpm create expo-app` 后改 `App.tsx`、安装 webview；可选 `.env` + `.env.dev`（局域网由 `pnpm sync:lan-env` 维护） |
| `app/app.config.ts` 或 `app.json` | `extra` / scheme（按需） |
| `README.md` | 人类可读：三端启动顺序、局域网 IP、ATS 提示 |

---

### Task 1: 根目录 workspace（pnpm + Node 24）

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.nvmrc`
- Modify: `.gitignore`（若不存在则创建）

- [ ] **Step 1: 写入 `.nvmrc`**

文件 `.nvmrc` 完整内容：

```
24
```

- [ ] **Step 2: 写入 `pnpm-workspace.yaml`**

```yaml
packages:
  - "app"
  - "web"
```

- [ ] **Step 3: 写入根 `package.json`**

```json
{
  "name": "tempo",
  "private": true,
  "packageManager": "pnpm@9.15.4",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "dev:web": "pnpm --filter web dev --host",
    "dev:app": "pnpm --filter app start",
    "dev:service": "cd service && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
  }
}
```

（将 `packageManager` 改为与本机 `pnpm -v` 一致，仅用于 Corepack/团队协作对齐，可按需删除该字段。）

- [ ] **Step 4: 合并 `.gitignore`（示例全文，可与现有合并去重）**

```
node_modules/
dist/
.expo/
ios/
android/
*.pyc
__pycache__/
.pytest_cache/
.venv/
venv/
.env
.env.*
!.env.example
.DS_Store
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml .nvmrc .gitignore
git commit -m "chore: add pnpm workspace root and Node 24 pin"
```

---

### Task 2: `service/` — FastAPI Mock 解析（TDD）

**Files:**
- Create: `service/pyproject.toml`
- Create: `service/app/__init__.py`（可为空）
- Create: `service/app/main.py`
- Create: `service/app/schemas.py`
- Create: `service/app/routers/__init__.py`（空）
- Create: `service/app/routers/schedule.py`
- Create: `service/app/services/__init__.py`（空）
- Create: `service/app/services/mock_parse.py`
- Create: `service/tests/test_schedule_parse.py`

- [ ] **Step 1: 创建目录与 `pyproject.toml`，再用 uv 同步依赖**

```bash
cd /path/to/tempo
mkdir -p service/app/routers service/app/services service/tests
```

在 `service/pyproject.toml` 写入下文全文（避免 `uv init` 默认 `src/` 布局与本计划的 `app.*` 导入不一致）；随后执行：

```bash
cd service
uv sync
```

`service/pyproject.toml` 全文如下：

```toml
[project]
name = "tempo-service"
version = "0.1.0"
description = "Tempo schedule parse API"
requires-python = ">=3.11"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "pydantic>=2.7.0",
]

[dependency-groups]
dev = [
    "pytest>=8.0.0",
    "httpx>=0.27.0",
]

[tool.pytest.ini_options]
pythonpath = ["."]
testpaths = ["tests"]
```

（若本地 uv 版本不支持 `[dependency-groups]`，可改为 `[project.optional-dependencies]` 下的 `dev`，并执行 `uv sync --extra dev`。）

- [ ] **Step 2: 编写失败测试 `service/tests/test_schedule_parse.py`**

```python
import uuid
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_parse_success_envelope():
    resp = client.post(
        "/api/v1/schedule/parse",
        json={
            "text": "明天下午3点和老王开会一小时",
            "timezone": "Asia/Shanghai",
            "locale": "zh-CN",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] == 0
    assert body["msg"] == "ok"
    assert body["traceId"]
    uuid.UUID(body["traceId"])  # traceId 使用 UUID 字符串
    data = body["data"]
    assert data["title"]
    assert data["all_day"] is False


def test_parse_error_when_text_missing():
    resp = client.post("/api/v1/schedule/parse", json={})
    assert resp.status_code == 200
    body = resp.json()
    assert body["code"] != 0
    assert body["data"] is None
    assert body["traceId"]
```

运行（应失败：模块不存在）：

```bash
cd service && uv run pytest tests/test_schedule_parse.py -v
```

Expected: `ImportError` / `ModuleNotFoundError` 或路由 404。

- [ ] **Step 3: 实现模型 `service/app/schemas.py`**

```python
from typing import Optional

from pydantic import BaseModel, Field


class ParseRequest(BaseModel):
    text: str = Field(..., min_length=1)
    timezone: Optional[str] = None
    locale: Optional[str] = None


class ScheduleDraft(BaseModel):
    title: str
    start_at: Optional[str] = None
    end_at: Optional[str] = None
    all_day: bool = False
    confidence: float = 0
    notes: Optional[str] = None


class ApiEnvelope(BaseModel):
    code: int
    msg: str
    data: Optional[ScheduleDraft] = None
    traceId: str
```

- [ ] **Step 4: 实现 Mock `service/app/services/mock_parse.py`**

```python
from app.schemas import ScheduleDraft


def mock_parse_schedule(text: str, timezone: str | None, locale: str | None) -> ScheduleDraft:
    _ = timezone, locale
    title = text.strip()[:80] or "未命名日程"
    return ScheduleDraft(
        title=title,
        start_at="2026-05-01T07:00:00.000Z",
        end_at="2026-05-01T08:00:00.000Z",
        all_day=False,
        confidence=0.0,
        notes=None,
    )
```

- [ ] **Step 5: 实现路由 `service/app/routers/schedule.py`**

```python
import uuid

from fastapi import APIRouter, Request

from app.schemas import ApiEnvelope, ParseRequest, ScheduleDraft
from app.services.mock_parse import mock_parse_schedule

router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])


@router.post("/parse", response_model=ApiEnvelope)
def parse_schedule(payload: ParseRequest, request: Request) -> ApiEnvelope:
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    try:
        draft = mock_parse_schedule(payload.text, payload.timezone, payload.locale)
        return ApiEnvelope(code=0, msg="ok", data=draft, traceId=trace_id)
    except Exception:
        return ApiEnvelope(code=10001, msg="parse_failed", data=None, traceId=trace_id)
```

（竖切阶段 `except` 几乎不到；保留以对齐错误 envelope。校验失败见下一步。）

- [ ] **Step 6: 实现应用 `service/app/main.py`**

```python
import uuid

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import schedule
from app.schemas import ApiEnvelope

app = FastAPI(title="Tempo Service")


@app.middleware("http")
async def trace_middleware(request: Request, call_next):
    trace_id = request.headers.get("x-trace-id") or str(uuid.uuid4())
    request.state.trace_id = trace_id
    response = await call_next(request)
    response.headers["x-trace-id"] = trace_id
    return response


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    trace_id = getattr(request.state, "trace_id", str(uuid.uuid4()))
    envelope = ApiEnvelope(code=10002, msg="invalid_request", data=None, traceId=trace_id)
    return JSONResponse(status_code=200, content=envelope.model_dump())


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(schedule.router)
```

说明：`422` 改为 **HTTP 200 + `code!=0`**，便于 Web 端单一分支处理（与设计「业务错误走 envelope」一致）。若你更喜欢 HTTP 422，可改测试与 Web 客户端——本计划保持 **HTTP 200 + envelope**。

- [ ] **Step 7: 运行测试**

```bash
cd service && uv run pytest tests/test_schedule_parse.py -v
```

Expected: **PASS**（若 `test_parse_error_when_text_missing` 失败，检查 validation handler 是否生效、`code` 是否为非 0）。

- [ ] **Step 8: 手动冒烟**

```bash
cd service && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

另开终端：

```bash
curl -s http://127.0.0.1:8000/api/v1/schedule/parse \
  -H 'Content-Type: application/json' \
  -d '{"text":"hello"}' | jq .
```

Expected: `code==0` 且含 `data`、`traceId`。

- [ ] **Step 9: Commit**

```bash
git add service
git commit -m "feat(service): add mock POST /api/v1/schedule/parse with envelope"
```

---

### Task 3: `web/` — Vite Vue 前端 + 仓储 + Vitest

**Files:**
- Create: `web/` 通过脚手架（见 Step 1）
- Create: `web/src/types/api.ts`
- Create: `web/src/api/parseSchedule.ts`
- Create: `web/src/repos/scheduleRepo.ts`
- Create: `web/src/repos/scheduleRepo.test.ts`
- Create: `web/.env.dev`（配合 `web/package.json` 中 `vite --mode dev`）
- Modify: `web/package.json`（加 vitest、jsdom、@vue/test-utils 如需）
- Modify: `web/vite.config.ts`（test 配置）
- Modify: `web/src/App.vue`

- [ ] **Step 1: 脚手架（在仓库根执行）**

```bash
cd /path/to/tempo
pnpm create vite@latest web --template vue-ts
pnpm install
```

（`pnpm create` 交互若询问 TS/eslint，选 TS；包管理器选 pnpm。）

确保 `web/package.json` 的 `name` 字段为 `"web"`（与 `--filter web` 一致）。

- [ ] **Step 2: 安装 Vitest**

```bash
pnpm --filter web add -D vitest @vue/test-utils jsdom @types/node
```

- [ ] **Step 3: 配置 `web/vite.config.ts`（在现有 `defineConfig` 内合并）**

完整示例（若与 vite 生成冲突，以合并 plugins 为主）：

```ts
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

在 `web/package.json` 的 `scripts` 增加：

```json
"test": "vitest run"
```

- [ ] **Step 4: 写入类型 `web/src/types/api.ts`**

```ts
export interface ScheduleDraft {
  title: string;
  start_at: string | null;
  end_at: string | null;
  all_day: boolean;
  confidence: number;
  notes: string | null;
}

export interface ApiEnvelope<T> {
  code: number;
  msg: string;
  data: T | null;
  traceId: string;
}
```

- [ ] **Step 5: 写入 API `web/src/api/parseSchedule.ts`**

```ts
import type { ApiEnvelope, ScheduleDraft } from "../types/api";

export async function parseSchedule(input: {
  text: string;
  timezone?: string;
  locale?: string;
  baseUrl: string;
}): Promise<ApiEnvelope<ScheduleDraft>> {
  const url = `${input.baseUrl.replace(/\/$/, "")}/api/v1/schedule/parse`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: input.text,
      timezone: input.timezone,
      locale: input.locale,
    }),
  });
  if (!resp.ok) {
    throw new Error(`http_${resp.status}`);
  }
  return (await resp.json()) as ApiEnvelope<ScheduleDraft>;
}
```

- [ ] **Step 6: 写入仓储 `web/src/repos/scheduleRepo.ts`**

```ts
import type { ScheduleDraft } from "../types/api";

const KEY = "tempo.schedules.v1";

export interface StoredSchedule extends ScheduleDraft {
  id: string;
  createdAt: string;
}

function readAll(): StoredSchedule[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredSchedule[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(items: StoredSchedule[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function saveDraft(draft: ScheduleDraft): StoredSchedule {
  const items = readAll();
  const row: StoredSchedule = {
    ...draft,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  items.unshift(row);
  writeAll(items);
  return row;
}

export function listSchedules(): StoredSchedule[] {
  return readAll();
}
```

- [ ] **Step 7: 写入失败测试 `web/src/repos/scheduleRepo.test.ts`**

```ts
import { describe, expect, it, beforeEach } from "vitest";
import { listSchedules, saveDraft } from "./scheduleRepo";

describe("scheduleRepo", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and lists drafts", () => {
    saveDraft({
      title: "会议",
      start_at: null,
      end_at: null,
      all_day: false,
      confidence: 0,
      notes: null,
    });
    const rows = listSchedules();
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("会议");
  });
});
```

运行：

```bash
pnpm --filter web test
```

Expected: **PASS**。

- [ ] **Step 8: 环境文件 `web/.env.dev`**

```
VITE_API_BASE_URL=http://127.0.0.1:8000
```

开发时使用 **`pnpm dev:web`**（Vite **`--mode dev`**）才会加载本文件。真机调试可在仓库根执行 **`pnpm sync:lan-env`**，自动创建/更新 **`web/.env.dev`** 与 **`app/.env.dev`** 中的局域网 IP（与 Expo 设备同一网段）；亦可手动改为例如 `http://192.168.1.10:8000`。

- [ ] **Step 9: 替换 `web/src/App.vue`（竖切最小 UI）**

```vue
<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { parseSchedule } from "./api/parseSchedule";
import { listSchedules, saveDraft, type StoredSchedule } from "./repos/scheduleRepo";

const text = ref("");
const busy = ref(false);
const error = ref<string | null>(null);
const rows = ref<StoredSchedule[]>([]);

const apiBase = computed(() => {
  const injected = (window as unknown as { __TEMPO_CONFIG__?: { apiBaseUrl?: string } })
    .__TEMPO_CONFIG__?.apiBaseUrl;
  return injected ?? import.meta.env.VITE_API_BASE_URL ?? "";
});

function refresh() {
  rows.value = listSchedules();
}

onMounted(refresh);

async function submit() {
  error.value = null;
  busy.value = true;
  try {
    const env = apiBase.value;
    if (!env) throw new Error("missing_api_base");
    const envTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const envelope = await parseSchedule({
      text: text.value,
      timezone: envTz,
      locale: navigator.language,
      baseUrl: env,
    });
    if (envelope.code !== 0 || !envelope.data) {
      error.value = envelope.msg || `error_${envelope.code}`;
      return;
    }
    saveDraft(envelope.data);
    text.value = "";
    refresh();
  } catch (e) {
    error.value = e instanceof Error ? e.message : "unknown_error";
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <main style="padding: 16px; font-family: system-ui">
    <h1 style="font-size: 20px">Tempo</h1>
    <textarea v-model="text" rows="4" style="width: 100%; box-sizing: border-box" />
    <div style="margin-top: 8px">
      <button :disabled="busy || !text.trim()" @click="submit">解析并保存</button>
    </div>
    <p v-if="error" style="color: crimson">Error: {{ error }}</p>
    <h2 style="margin-top: 24px; font-size: 16px">已保存</h2>
    <ul>
      <li v-for="r in rows" :key="r.id">
        <strong>{{ r.title }}</strong>
        <div style="opacity: 0.7; font-size: 12px">{{ r.start_at }} → {{ r.end_at }}</div>
      </li>
    </ul>
  </main>
</template>
```

- [ ] **Step 10: 浏览器手工验证**

终端 1：`pnpm dev:service`  
终端 2：`pnpm dev:web`  
浏览器打开 Vite 提示的 URL，输入文本 → 应出现在列表。

- [ ] **Step 11: Commit**

```bash
git add web
git commit -m "feat(web): vue vite UI with parse client and local storage"
```

---

### Task 4: `app/` — Expo + WebView + 配置注入

**Files:**
- Create: `app/` 通过 Expo 脚手架
- Modify: `app/App.tsx`（或生成的主入口）
- Modify: `app/package.json`（依赖）
- Create: 可选 `app/.env`；局域网真机推荐根目录 **`pnpm sync:lan-env`** 维护 **`app/.env.dev`**（`app.config.ts` 已 `loadEnv` 且后者覆盖同名变量）

- [ ] **Step 1: 脚手架**

```bash
cd /path/to/tempo
pnpm create expo-app@latest app --template blank-typescript
pnpm install
```

确保 `app/package.json` 的 `name` 为 `"app"`。

- [ ] **Step 2: 安装 WebView**

```bash
pnpm --filter app add react-native-webview
```

- [ ] **Step 3: 配置环境 `app/.env` / `app/.env.dev`（开发示例；IP 换成你的局域网地址）**

```
EXPO_PUBLIC_WEB_BASE_URL=http://192.168.1.10:5174
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.10:8000
```

说明：`WEB` 指向 Vite **`--host`**（默认端口 **5174**）；`API` 与 **`web/.env.dev`** 中 `VITE_API_BASE_URL` 保持一致，供注入。日常可用仓库根 **`pnpm sync:lan-env`** 同步 **`app/.env.dev`**。

安装 expo env（若模板未内置）：

```bash
pnpm --filter app add expo-constants
```

（Expo SDK 49+ 通常已支持 `EXPO_PUBLIC_`；若读取失败，用 `app.config.ts` 的 `extra`。）

- [ ] **Step 4: 使用 `app/App.tsx` 完整替换**

```tsx
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

const WEB_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL ?? "http://127.0.0.1:5174";
const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export default function App() {
  const injected = `window.__TEMPO_CONFIG__ = ${JSON.stringify({
    apiBaseUrl: API_URL,
  })}; true;`;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <View style={styles.banner}>
        <Text style={styles.bannerText}>Tempo shell · WebView</Text>
      </View>
      <WebView
        source={{ uri: WEB_URL }}
        injectedJavaScriptBeforeContentLoaded={injected}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  banner: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: "#ddd" },
  bannerText: { fontSize: 12, opacity: 0.7 },
});
```

- [ ] **Step 5: iOS 开发期 ATS（允许明文 HTTP）**

若目标包含 **iOS 物理机** loading `http://…`，在 `app/app.json` 的 `ios.infoPlist` 增加（仅开发）：

```json
"NSAppTransportSecurity": {
  "NSAllowsArbitraryLoads": true
}
```

（上线前应收紧；design spec 已说明生产 HTTPS。）

- [ ] **Step 6: 手工 E2E**

1. 启动 `pnpm dev:service`  
2. 启动 `pnpm dev:web --host`（使局域网可访问）  
3. 启动 `pnpm dev:app`，真机与电脑同网  
4. App 内 WebView 提交一句话 → 列表出现记录  

Expected: 与浏览器一致。

- [ ] **Step 7: Commit**

```bash
git add app
git commit -m "feat(app): expo webview shell with injected API base URL"
```

---

### Task 5: 文档与收尾

**Files:**
- Create或替换: `README.md`

- [ ] **Step 1: 写入根 `README.md`（示例全文，简体中文）**

```markdown
# Tempo

本地日程竖切（Expo WebView + Vue + FastAPI Mock）。

## 环境要求

- Node.js 24 + pnpm
- Python 3.11+，建议使用 uv 管理依赖
- Xcode / Android Studio / 真机（用于验证 WebView）

## 本地启动顺序

1. 后端：`pnpm dev:service`（默认监听 `0.0.0.0:8000`）
2. 前端：`pnpm dev:web`（需在局域网可访问时请使用脚本中的 `--host`）
3. 客户端：`pnpm dev:app`

真机调试时，在仓库根执行 **`pnpm sync:lan-env`** 更新 **`web/.env.dev`** 与 **`app/.env.dev`**，或手动将其中地址改为 **电脑的局域网 IP**（与手机同一网段），并保证手机和电脑可互通。

## 文档

- 设计说明：`docs/superpowers/specs/2026-04-30-tempo-design.md`
- 实施计划：`docs/superpowers/plans/2026-04-30-tempo-mvp-vertical-slice.md`
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add tempo dev README"
```

---

## Self-review（计划作者自检）

| Spec 条款 | 对应 Task |
|-----------|-----------|
| `POST /api/v1/schedule/parse` | Task 2 |
| envelope `code/msg/data/traceId` | Task 2、3 |
| `code!==0` 异常、`data` 可 null | Task 2 validation handler + tests |
| Mock→LLM 同路径 | Task 2 `mock_parse.py` 可替换实现 |
| Web localStorage + Repository | Task 3 |
| RN WebView + 注入配置 | Task 4 |
| pnpm + Node 24 | Task 1 |
| 目录 `app/web/service/docs` | 全文路径 |

**占位符扫描：** 无 TBD；README 提示「改为简体中文」为有意的交付说明，落地时替换正文即可。

**类型一致性：** TS `ScheduleDraft` 与 Pydantic `ScheduleDraft` 字段对齐；envelope 泛型与后端一致。

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-30-tempo-mvp-vertical-slice.md`. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration  

**2. Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints  

Which approach?

# Tempo

本地日程 MVP 竖切：Expo WebView 壳 + Vue（Vite）+ FastAPI Mock 解析 API。

## 环境要求

- **Node.js 24+**（仓库含 `.nvmrc`；若本地暂未升级，可先验证构建，但请以团队约定为准）
- **pnpm**（根目录 `packageManager` 字段对齐版本）
- **Python 3.11+**，并安装 [**uv**](https://docs.astral.sh/uv/)（用于 `service/`）
- Xcode / Android Studio / 真机（验证 WebView）

## 仓库结构

- **app/**：Expo（react-native-webview）；安装包英文名 **Tempo**，中文名 **轻程**（桌面展示名随系统语言切换：`app/app.json`、`app/languages/`）
- `web/`：Vue 3 + Vite
- `service/`：FastAPI
- `docs/superpowers/`：设计与实施文档

## 本地启动

终端 1 — 后端：

```bash
pnpm dev:service
```

终端 2 — Web（默认带 `--host` 便于局域网调试）：

```bash
pnpm dev:web
```

终端 3 — App：

```bash
pnpm dev:app
```

### 真机 WebView（避免 `Could not connect to the server` / -1004）

1. **必须有 `app/.env`**：`.env.example` 不会被自动读取。执行 `cp app/.env.example app/.env`，把其中的 **`127.0.0.1` 改成 Mac 的局域网 IP**（与 Metro 里 `exp://…` 的 IP 一致）。
2. **`web/.env.development`** 里的 **`VITE_API_BASE_URL`** 同步改成同一 IP。
3. Mac 上 **`pnpm dev:web`**、**`pnpm dev:service`** 保持运行。
4. 改完 `.env` 后请在 **`app/`** 目录执行 **`pnpm exec expo start --clear`** 清缓存重启（否则会一直用旧的 localhost）。
5. iOS 可能弹出 **本地网络** 权限，请选择允许（已在 `app.config.ts` 里补充说明文案）。

## 文档

- 设计：`docs/superpowers/specs/2026-04-30-tempo-design.md`
- 实施计划：`docs/superpowers/plans/2026-04-30-tempo-mvp-vertical-slice.md`

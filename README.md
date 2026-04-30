# Tempo

本地日程 MVP 竖切：Expo WebView 壳 + Vue（Vite）+ FastAPI Mock 解析 API。

## 环境要求

- **Node.js 24+**（仓库含 `.nvmrc`；若本地暂未升级，可先验证构建，但请以团队约定为准）
- **pnpm**（根目录 `packageManager` 字段对齐版本）
- **Python 3.11+**，并安装 [**uv**](https://docs.astral.sh/uv/)（用于 `service/`）
- Xcode / Android Studio / 真机（验证 WebView）

## 仓库结构

- `app/`：Expo（`react-native-webview`）
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

复制 `app/.env.example` 为 `app/.env`，将其中地址改为 **电脑的局域网 IP**（真机与电脑同网段时）。`web/.env.development` 同样改为该 IP，以便设备访问 `service` 与 Vite。

## 文档

- 设计：`docs/superpowers/specs/2026-04-30-tempo-design.md`
- 实施计划：`docs/superpowers/plans/2026-04-30-tempo-mvp-vertical-slice.md`

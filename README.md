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

### macOS + iTerm2：一键在同一窗口打开 3 个 Tab（推荐）

```bash
pnpm dev
```

会在 **iTerm2** 中新建 **1 个窗口**，内含 **3 个 Tab**，分别执行 `pnpm dev:service`、`pnpm dev:web`、`pnpm dev:app`（脚本：`scripts/dev-iterm.sh`）。**打开 Tab 之前**会先执行 **`pnpm sync:lan-env`**，创建/更新 **`web/.env.dev`** 与 **`app/.env.dev`** 中的局域网 URL。Tab / 窗口标题遵循你在 Profile 里的设置。

若无响应：请在 **系统设置 → 隐私与安全性 → 自动化** 中允许当前应用控制 **iTerm**。未安装 iTerm2 时请先安装：[iterm2.com](https://iterm2.com/)

### 手动分别启动（任意终端）

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

### Deep linking（日程板块）

`app/core/navigation/linking.ts` 注册前缀 `tempo://` 与 `https://tempo.app`，Main 栈路径段为 `app`，日程 Tab 路径段为 `schedule`。示例：

- 日程首页：`tempo://app/schedule`、`https://tempo.app/app/schedule`
- 通知收件箱：`tempo://app/schedule/notifications`、`https://tempo.app/app/schedule/notifications`

本地 Mock 日程数据保存在 AsyncStorage，键名为 **`tempo.schedule.v1`**（卸载应用或清空存储可重新写入 seed）。

### 真机 WebView（避免 `Could not connect to the server` / -1004）

1. 在仓库根目录执行 **`pnpm sync:lan-env`**（仅开 Web/App 时也请先执行一次）。脚本会**自动创建**缺失的 **`web/.env.dev`** / **`app/.env.dev`**，并写入当前机器的局域网 IP（**`VITE_API_BASE_URL`**、**`EXPO_PUBLIC_WEB_BASE_URL`**、**`EXPO_PUBLIC_API_BASE_URL`**）。  
   - Web：`pnpm dev:web` 使用 Vite **`--mode dev`**，开发时读取 **`web/.env.dev`**。  
   - App：`app.config.ts` 会加载 **`.env`**、**`.env.local`**、**`.env.dev`**（后者覆盖同名变量）。
2. （可选）复制 **`app/.env.example`** 为 **`app/.env`** 作为默认占位；真机仍以 **`.env.dev`** 中的局域网地址为准。
3. Mac 上 **`pnpm dev:web`**、**`pnpm dev:service`** 保持运行。
4. 修改环境变量后请在 **`app/`** 目录执行 **`pnpm exec expo start --clear`** 清缓存重启（否则会一直用旧的缓存配置）。
5. iOS 可能弹出 **本地网络** 权限，请选择允许（已在 `app.config.ts` 里补充说明文案）。

## 文档

- 设计：`docs/superpowers/specs/2026-04-30-tempo-design.md`
- 实施计划：`docs/superpowers/plans/2026-04-30-tempo-mvp-vertical-slice.md`

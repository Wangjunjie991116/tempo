#!/usr/bin/env bash
# macOS + iTerm2：新建 1 个窗口，内含 3 个 Tab，分别跑 service / web / app。
# 用法（仓库根目录）：pnpm dev
# 开 Tab 前执行 scripts/sync-dev-lan-env.sh，同步 web/.env.dev、app/.env.dev 局域网 URL。
#
# 依赖：已安装 iTerm2（AppleScript 应用名为「iTerm」）；pnpm；可选 nvm；uv 建议在 ~/.local/bin。
# 若无响应：系统设置 → 隐私与安全性 → 自动化 → 允许 Cursor / 当前终端控制「iTerm」。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "scripts/dev-iterm.sh 仅支持 macOS（需通过 AppleScript 驱动 iTerm2）。" >&2
  echo "请在当前系统打开三个终端，分别执行：" >&2
  echo "  pnpm dev:service" >&2
  echo "  pnpm dev:web" >&2
  echo "  pnpm dev:app" >&2
  exit 1
fi

if ! osascript -e 'tell application "iTerm" to get name' >/dev/null 2>&1; then
  echo "无法通过 AppleScript 控制 iTerm。请确认：" >&2
  echo "  1) 已安装 iTerm2：https://iterm2.com/（应用名须为「iTerm」）" >&2
  echo "  2) 系统设置 → 隐私与安全性 → 自动化：允许当前终端（或 Cursor）控制「iTerm」" >&2
  echo "" >&2
  echo "若不使用 iTerm，请在三个终端分别执行：" >&2
  echo "  pnpm dev:service" >&2
  echo "  pnpm dev:web" >&2
  echo "  pnpm dev:app" >&2
  exit 1
fi

export TEMPO_REPO_ROOT="$ROOT"

bash "$SCRIPT_DIR/sync-dev-lan-env.sh"

if ! osascript <<'APPLESCRIPT'
on run
	set repoPath to (system attribute "TEMPO_REPO_ROOT")
	if repoPath is missing value or repoPath is "" then
		error "缺少环境变量 TEMPO_REPO_ROOT"
	end if
	set prep to "cd " & quoted form of repoPath & " && export PATH=$HOME/.local/bin:$PATH && test -f $HOME/.nvm/nvm.sh && . $HOME/.nvm/nvm.sh 2>/dev/null; command -v nvm >/dev/null 2>&1 && nvm use 24 2>/dev/null || true; "
	tell application "iTerm"
		activate
		create window with default profile
		tell current session of current window
			write text (prep & "pnpm dev:service")
		end tell
		tell current window
			create tab with default profile
		end tell
		tell current session of current window
			write text (prep & "pnpm dev:web")
		end tell
		tell current window
			create tab with default profile
		end tell
		tell current session of current window
			write text (prep & "pnpm dev:app")
		end tell
	end tell
end run
APPLESCRIPT
then
  echo >&2 ""
  echo >&2 "AppleScript 打开 iTerm 窗口失败。常见原因：" >&2
  echo >&2 "  • 系统设置 → 隐私与安全性 → 自动化：允许当前终端（或 Cursor）控制「iTerm」" >&2
  echo >&2 "  • iTerm 正在请求前台权限时被拒绝" >&2
  echo >&2 "请改用三个终端分别运行：pnpm dev:service / pnpm dev:web / pnpm dev:app" >&2
  exit 1
fi

echo "已在 iTerm2 新建 1 个窗口（3 个 Tab）：pnpm dev:service / dev:web / dev:app"
echo "项目目录：$ROOT"

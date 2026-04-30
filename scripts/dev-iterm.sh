#!/usr/bin/env bash
# macOS + iTerm2：新建 1 个窗口，内含 3 个 Tab，分别跑 service / web / app。
# 用法（仓库根目录）：pnpm dev
#
# 依赖：已安装 iTerm2（AppleScript 应用名为「iTerm」）；pnpm；可选 nvm；uv 建议在 ~/.local/bin。
# 若无响应：系统设置 → 隐私与安全性 → 自动化 → 允许 Cursor / 当前终端控制「iTerm」。
#
# Tab 标题：脚本对每个 session 执行「set name」，一般显示为 Tempo · service / web / app。
# 若运行中被 shell 改掉：可在该 Tab 右键 → Edit Session → 勾选锁定标题（视 iTerm 版本而定）。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "该脚本仅支持 macOS。"
  exit 1
fi

if ! osascript -e 'tell application "iTerm" to get name' >/dev/null 2>&1; then
  echo "无法通过 AppleScript 控制 iTerm。请确认已安装 iTerm2（https://iterm2.com/），且名称在脚本中为「iTerm」。"
  exit 1
fi

# 通过环境变量传路径，AppleScript 内用 quoted form of，避免 bash 与 AppleScript 引号转义冲突（此前 \" 会触发 -2741）
export TEMPO_REPO_ROOT="$ROOT"

osascript <<'APPLESCRIPT'
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
			set name to "Tempo · service"
		end tell
		tell current window
			create tab with default profile
		end tell
		tell current session of current window
			write text (prep & "pnpm dev:web")
			set name to "Tempo · web"
		end tell
		tell current window
			create tab with default profile
		end tell
		tell current session of current window
			write text (prep & "pnpm dev:app")
			set name to "Tempo · app"
		end tell
	end tell
end run
APPLESCRIPT

echo "已在 iTerm2 新建 1 个窗口（3 个 Tab）：Tempo · service / web / app"
echo "项目目录：$ROOT"

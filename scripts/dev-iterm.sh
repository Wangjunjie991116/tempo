#!/usr/bin/env bash
# macOS + iTerm2：依次新建 3 个窗口，分别跑 service / web / app。
# 用法（仓库根目录）：pnpm dev
#
# 依赖：已安装 iTerm2（AppleScript 应用名为「iTerm」）；pnpm；可选 nvm；uv 建议在 ~/.local/bin。
# 若无响应：系统设置 → 隐私与安全性 → 自动化 → 允许 Cursor / 当前终端控制「iTerm」。

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

launch_iterm_window() {
  local cmd="$1"
  local root_q
  root_q="$(printf %q "$ROOT")"
  osascript <<EOF
tell application "iTerm"
    activate
    create window with default profile
    tell current session of current window
        write text "cd ${root_q} && export PATH=\\\"\\\$HOME/.local/bin:\\\$PATH\\\" && test -f \\\"\\\$HOME/.nvm/nvm.sh\\\" && . \\\"\\\$HOME/.nvm/nvm.sh\\\" 2>/dev/null; command -v nvm >/dev/null 2>&1 && nvm use 24 2>/dev/null || true; ${cmd}"
    end tell
end tell
EOF
}

osascript -e 'tell application "iTerm" to activate' >/dev/null 2>&1 || true

launch_iterm_window "pnpm dev:service"
sleep 0.35
launch_iterm_window "pnpm dev:web"
sleep 0.35
launch_iterm_window "pnpm dev:app"

echo "已在 iTerm2 打开 3 个窗口：dev:service / dev:web / dev:app"
echo "项目目录：$ROOT"

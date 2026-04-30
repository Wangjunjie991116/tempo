#!/usr/bin/env bash
# macOS：一次打开 3 个「终端」窗口，分别运行 service / web / app。
# 用法（仓库根目录）：pnpm dev:terminals   或   bash scripts/start-dev-terminals.sh
#
# 依赖：Terminal.app；pnpm；可选 nvm（~/.nvm/nvm.sh）；uv 建议在 PATH 或 ~/.local/bin。
# 若无响应：系统设置 → 隐私与安全性 → 自动化 → 允许当前 IDE / Terminal 控制「终端」。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "start-dev-terminals.sh 仅支持 macOS（AppleScript + Terminal.app）。"
  echo "请手动开三个终端执行：pnpm dev:service / dev:web / dev:app"
  exit 1
fi

launch_in_terminal() {
  local cmd="$1"
  local root_q
  root_q="$(printf %q "$ROOT")"
  osascript <<EOF
tell application "Terminal"
    activate
    do script "cd ${root_q} && export PATH=\\\"\\\$HOME/.local/bin:\\\$PATH\\\" && test -f \\\"\\\$HOME/.nvm/nvm.sh\\\" && . \\\"\\\$HOME/.nvm/nvm.sh\\\" 2>/dev/null; command -v nvm >/dev/null 2>&1 && nvm use 24 2>/dev/null || true; ${cmd}"
end tell
EOF
}

osascript -e 'tell application "Terminal" to activate' >/dev/null 2>&1 || true

launch_in_terminal "pnpm dev:service"
sleep 0.35
launch_in_terminal "pnpm dev:web"
sleep 0.35
launch_in_terminal "pnpm dev:app"

echo "已在 Terminal.app 打开 3 个窗口：dev:service / dev:web / dev:app"
echo "项目目录：$ROOT"

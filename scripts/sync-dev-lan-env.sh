#!/usr/bin/env bash
# 将 web/app 的 web/.env.dev、app/.env.dev 中的局域网 URL 写成本机 IPv4（不存在则创建）。
# 用法：仓库根目录执行 pnpm sync:lan-env；pnpm dev（macOS iTerm）会在开 Tab 前自动执行。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

WEB_PORT="${TEMPO_WEB_PORT:-5174}"
API_PORT="${TEMPO_API_PORT:-8000}"

detect_lan_ipv4() {
  local ip iface os
  os="$(uname -s)"
  if [[ "$os" == "Darwin" ]]; then
    iface=$(route -n get default 2>/dev/null | awk '/interface: / { print $2; exit }')
    if [[ -n "${iface:-}" ]]; then
      ip=$(ipconfig getifaddr "$iface" 2>/dev/null || true)
      [[ -n "$ip" ]] && { echo "$ip"; return 0; }
    fi
    for try in en0 en1 en2; do
      ip=$(ipconfig getifaddr "$try" 2>/dev/null || true)
      [[ -n "$ip" ]] && { echo "$ip"; return 0; }
    done
  elif [[ "$os" == "Linux" ]]; then
    ip=$(ip -4 route get 1.1.1.1 2>/dev/null | awk '{ for (i = 1; i <= NF; i++) if ($i == "src") { print $(i + 1); exit } }')
    [[ -n "$ip" ]] && { echo "$ip"; return 0; }
    ip=$(hostname -I 2>/dev/null | awk '{ print $1 }')
    [[ -n "$ip" ]] && { echo "$ip"; return 0; }
  fi
  return 1
}

ensure_env_dev() {
  local file="$1"
  mkdir -p "$(dirname "$file")"
  if [[ ! -f "$file" ]]; then
    printf '%s\n' "# 本地开发（pnpm sync:lan-env 会更新下列变量，用于本地三端调试）" >"$file"
  fi
}

upsert_kv() {
  local file="$1" key="$2" val="$3"
  mkdir -p "$(dirname "$file")"
  [[ -f "$file" ]] || touch "$file"
  if grep -q "^${key}=" "$file" 2>/dev/null; then
    if [[ "$(uname -s)" == "Darwin" ]]; then
      sed -i '' "s|^${key}=.*|${key}=${val}|" "$file"
    else
      sed -i "s|^${key}=.*|${key}=${val}|" "$file"
    fi
  else
    printf '%s=%s\n' "$key" "$val" >> "$file"
  fi
}

main() {
  local ip
  if ! ip=$(detect_lan_ipv4); then
    ip="127.0.0.1"
    echo "sync-dev-lan-env: 未检测到局域网 IPv4，使用 127.0.0.1（真机连 Mac 时请检查 Wi‑Fi / 有线）" >&2
  fi

  local web_env="$ROOT/web/.env.dev"
  local app_env="$ROOT/app/.env.dev"
  ensure_env_dev "$web_env"
  ensure_env_dev "$app_env"

  upsert_kv "$web_env" "VITE_API_BASE_URL" "http://${ip}:${API_PORT}"
  upsert_kv "$app_env" "EXPO_PUBLIC_WEB_BASE_URL" "http://${ip}:${WEB_PORT}"
  upsert_kv "$app_env" "EXPO_PUBLIC_API_BASE_URL" "http://${ip}:${API_PORT}"

  echo "sync-dev-lan-env: ${ip} → web/.env.dev (VITE_API_BASE_URL), app/.env.dev (EXPO_PUBLIC_*；web :${WEB_PORT}, api :${API_PORT})"
}

main "$@"

#!/usr/bin/env bash
# =============================================================================
# Rudex v5.5.1 -- Uninstaller for macOS & Linux (Restores Stock English UI)
# =============================================================================
set -e

echo "========================================================"
echo "  Rudex v5.5.1 -- Uninstaller (Restore English UI)"
echo "========================================================"
echo ""

OS_TYPE="$(uname -s)"
SCRIPT_PATH="${BASH_SOURCE[0]:-}"
SCRIPT_DIR=""
if [ -n "$SCRIPT_PATH" ] && [ -f "$SCRIPT_PATH" ]; then
  SCRIPT_DIR="$(cd -- "$(dirname -- "$SCRIPT_PATH")" >/dev/null 2>&1 && pwd -P)"
fi

UNINSTALL_JS=""
INSTALL_JS=""
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/skills/rudex/scripts/uninstall.js" ]; then
  UNINSTALL_JS="$SCRIPT_DIR/skills/rudex/scripts/uninstall.js"
  INSTALL_JS="$SCRIPT_DIR/skills/rudex/scripts/install.js"
elif [ -f "$HOME/.gemini/config/plugins/rudex/skills/rudex/scripts/uninstall.js" ]; then
  UNINSTALL_JS="$HOME/.gemini/config/plugins/rudex/skills/rudex/scripts/uninstall.js"
  INSTALL_JS="$HOME/.gemini/config/plugins/rudex/skills/rudex/scripts/install.js"
fi

if [ -z "$UNINSTALL_JS" ] || [ ! -f "$UNINSTALL_JS" ]; then
  echo "[ERROR] Uninstaller script not found."
  exit 1
fi

find_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return 0
  fi
  for cand in \
    "/opt/homebrew/bin/node" \
    "/usr/local/bin/node" \
    "/usr/bin/node" \
    "$HOME/.volta/bin/node" \
    "$HOME/.asdf/shims/node" \
    "$HOME/.mise/shims/node" \
    "$HOME/.local/bin/node"; do
    if [ -x "$cand" ]; then
      printf '%s\n' "$cand"
      return 0
    fi
  done
  local latest_nvm=""
  for cand in "$HOME"/.nvm/versions/node/*/bin/node; do
    if [ -x "$cand" ]; then
      latest_nvm="$cand"
    fi
  done
  if [ -n "$latest_nvm" ]; then
    printf '%s\n' "$latest_nvm"
    return 0
  fi
  return 1
}

find_antigravity_bin() {
  if [ "$OS_TYPE" = "Darwin" ]; then
    for cand in \
      "/Applications/Antigravity.app/Contents/MacOS/Antigravity" \
      "$HOME/Applications/Antigravity.app/Contents/MacOS/Antigravity" \
      "/Applications/Google Antigravity.app/Contents/MacOS/Google Antigravity" \
      "$HOME/Applications/Google Antigravity.app/Contents/MacOS/Google Antigravity"; do
      if [ -x "$cand" ]; then
        printf '%s\n' "$cand"
        return 0
      fi
    done
  else
    if command -v antigravity >/dev/null 2>&1; then
      command -v antigravity
      return 0
    fi
    for cand in \
      "/usr/bin/antigravity" \
      "/usr/bin/Antigravity" \
      "/usr/local/bin/antigravity" \
      "/opt/antigravity/antigravity" \
      "/opt/Antigravity/Antigravity" \
      "/opt/google/antigravity/antigravity" \
      "$HOME/.local/share/antigravity/antigravity" \
      "$HOME/.local/share/Antigravity/Antigravity"; do
      if [ -x "$cand" ]; then
        printf '%s\n' "$cand"
        return 0
      fi
    done
  fi
  return 1
}

find_antigravity_bundle() {
  if [ "$OS_TYPE" = "Darwin" ]; then
    for cand in \
      "/Applications/Antigravity.app" \
      "$HOME/Applications/Antigravity.app" \
      "/Applications/Google Antigravity.app" \
      "$HOME/Applications/Google Antigravity.app"; do
      if [ -d "$cand" ]; then
        printf '%s\n' "$cand"
        return 0
      fi
    done
  fi
  return 1
}

NODE_BIN="$(find_node || true)"
AGY_BIN="$(find_antigravity_bin || true)"
AGY_BUNDLE="$(find_antigravity_bundle || true)"

RUNTIME_MODE=""
RUNNER_BIN=""
if [ -n "$NODE_BIN" ] && [ -x "$NODE_BIN" ]; then
  RUNTIME_MODE="node"
  RUNNER_BIN="$NODE_BIN"
elif [ -n "$AGY_BIN" ] && [ -x "$AGY_BIN" ]; then
  RUNTIME_MODE="electron"
  RUNNER_BIN="$AGY_BIN"
else
  echo "[ERROR] Neither Node.js nor Antigravity executable found to run uninstall.js."
  exit 1
fi

run_js() {
  local target_script="$1"
  shift
  if [ "$RUNTIME_MODE" = "node" ]; then
    "$RUNNER_BIN" "$target_script" "$@"
  else
    ELECTRON_RUN_AS_NODE=1 ELECTRON_NO_ASAR=1 "$RUNNER_BIN" "$target_script" "$@"
  fi
}

run_js_as_sudo() {
  local res_dir="$1"
  local target_script="$2"
  shift 2
  if [ "$RUNTIME_MODE" = "node" ]; then
    sudo env HOME="$HOME" ANTIGRAVITY_RESOURCES_DIR="$res_dir" "$RUNNER_BIN" "$target_script" "$@"
  else
    sudo env HOME="$HOME" ANTIGRAVITY_RESOURCES_DIR="$res_dir" ELECTRON_RUN_AS_NODE=1 ELECTRON_NO_ASAR=1 "$RUNNER_BIN" "$target_script" "$@"
  fi
}

is_inside_antigravity() {
  local cur_pid="$$"
  local depth=0
  while [ "$depth" -lt 12 ] && [ -n "$cur_pid" ] && [ "$cur_pid" -gt 1 ] 2>/dev/null; do
    local info=""
    info="$(ps -o ppid=,comm= -p "$cur_pid" 2>/dev/null || true)"
    [ -z "$info" ] && break
    local ppid=""
    local comm=""
    ppid="$(printf '%s\n' "$info" | awk '{print $1}')"
    comm="$(printf '%s\n' "$info" | awk '{$1=""; sub(/^[ \t]+/, ""); print}')"
    case "$comm" in
      *Antigravity*|*antigravity*)
        return 0
        ;;
    esac
    [ "$ppid" = "$cur_pid" ] && break
    cur_pid="$ppid"
    depth=$((depth + 1))
  done
  return 1
}

is_antigravity_running() {
  if [ "$OS_TYPE" = "Darwin" ]; then
    pgrep -x "Antigravity" >/dev/null 2>&1 || pgrep -x "Google Antigravity" >/dev/null 2>&1
  else
    pgrep -x "antigravity" >/dev/null 2>&1 || pgrep -x "Antigravity" >/dev/null 2>&1
  fi
}

close_antigravity() {
  pkill -TERM -x "sherpa-onnx-online-websocket-server" 2>/dev/null || true
  if [ "$OS_TYPE" = "Darwin" ]; then
    osascript -e 'tell application "Antigravity" to quit' 2>/dev/null || true
    osascript -e 'tell application "Google Antigravity" to quit' 2>/dev/null || true
  else
    pkill -TERM -x "antigravity" 2>/dev/null || true
    pkill -TERM -x "Antigravity" 2>/dev/null || true
  fi
  local waited=0
  while is_antigravity_running && [ "$waited" -lt 10 ]; do
    sleep 0.5
    waited=$((waited + 1))
  done
  if is_antigravity_running; then
    if [ "$OS_TYPE" = "Darwin" ]; then
      pkill -KILL -x "Antigravity" 2>/dev/null || true
      pkill -KILL -x "Google Antigravity" 2>/dev/null || true
    else
      pkill -KILL -x "antigravity" 2>/dev/null || true
      pkill -KILL -x "Antigravity" 2>/dev/null || true
    fi
    sleep 0.5
  fi
}

NO_RESTART=0
REMOVE_PLUGIN=0
for arg in "$@"; do
  case "$arg" in
    --no-restart) NO_RESTART=1 ;;
    --remove-plugin) REMOVE_PLUGIN=1 ;;
  esac
done

WAS_RUNNING=0
if is_antigravity_running; then
  WAS_RUNNING=1
fi

if [ "$WAS_RUNNING" -eq 1 ] && ! is_inside_antigravity; then
  echo "[Rudex] Closing Antigravity before restoring stock English UI..."
  close_antigravity
fi

RES_DIR=""
if [ -n "$INSTALL_JS" ] && [ -f "$INSTALL_JS" ]; then
  RES_OUT="$(run_js "$INSTALL_JS" --print-resources 2>/dev/null || true)"
  RES_DIR="$(printf '%s\n' "$RES_OUT" | sed -n 's/^RESOURCES_DIR=//p' | head -n 1)"
  DETECTED_EXE="$(printf '%s\n' "$RES_OUT" | sed -n 's/^AGY_EXE=//p' | head -n 1)"
  DETECTED_BUNDLE="$(printf '%s\n' "$RES_OUT" | sed -n 's/^APP_BUNDLE=//p' | head -n 1)"
  [ -z "$AGY_BIN" ] && [ -n "$DETECTED_EXE" ] && AGY_BIN="$DETECTED_EXE"
  [ -z "$AGY_BUNDLE" ] && [ -n "$DETECTED_BUNDLE" ] && AGY_BUNDLE="$DETECTED_BUNDLE"
fi

echo "[Rudex] Restoring stock English Antigravity UI..."
u_args=()
[ "$REMOVE_PLUGIN" -eq 1 ] && u_args+=(--remove-plugin)

if [ -n "$RES_DIR" ] && [ -d "$RES_DIR" ] && [ ! -w "$RES_DIR" ] && command -v sudo >/dev/null 2>&1; then
  echo "[Rudex] Elevated permissions needed for $RES_DIR (requesting sudo)..."
  run_js_as_sudo "$RES_DIR" "$UNINSTALL_JS"
  run_js "$UNINSTALL_JS" "${u_args[@]}"
else
  run_js "$UNINSTALL_JS" "${u_args[@]}"
fi

echo ""
echo "[Rudex] Stock English Antigravity UI restored cleanly."
if [ "$WAS_RUNNING" -eq 1 ] && [ "$NO_RESTART" -eq 0 ] && ! is_inside_antigravity; then
  if [ "$OS_TYPE" = "Darwin" ] && [ -n "$AGY_BUNDLE" ] && [ -d "$AGY_BUNDLE" ]; then
    open -a "$AGY_BUNDLE" >/dev/null 2>&1 || open "$AGY_BUNDLE" >/dev/null 2>&1 || true
  elif [ "$OS_TYPE" = "Darwin" ]; then
    open -a "Antigravity" >/dev/null 2>&1 || true
  elif [ -n "$AGY_BIN" ] && [ -x "$AGY_BIN" ]; then
    nohup "$AGY_BIN" >/dev/null 2>&1 &
  fi
fi

exit 0

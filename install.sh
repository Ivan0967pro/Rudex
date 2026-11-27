#!/usr/bin/env bash
# =============================================================================
# Rudex v5.5.5 -- Cross-Platform Installer & Antigravity Patcher (macOS / Linux)
# Local usage:  ./install.sh [--dry-run|--status|--plugin-only|--uninstall|--no-restart|--force]
# Remote usage: curl -fsSL https://raw.githubusercontent.com/Ivan0967pro/Rudex/main/install.sh | bash
# =============================================================================
set -e

REPO_OWNER="Ivan0967pro"
REPO_NAME="Rudex"
BRANCH="${RUDEX_BRANCH:-main}"

echo "========================================================"
echo "  Rudex v5.5.5 -- Installer & Antigravity Patcher"
echo "========================================================"
echo ""

OS_TYPE="$(uname -s)"
SCRIPT_PATH="${BASH_SOURCE[0]:-}"
SCRIPT_DIR=""
if [ -n "$SCRIPT_PATH" ] && [ -f "$SCRIPT_PATH" ]; then
  SCRIPT_DIR="$(cd -- "$(dirname -- "$SCRIPT_PATH")" >/dev/null 2>&1 && pwd -P)"
fi

IS_LOCAL_REPO=0
if [ -n "$SCRIPT_DIR" ] && [ -f "$SCRIPT_DIR/plugin.json" ] && [ -f "$SCRIPT_DIR/skills/rudex/scripts/install.js" ]; then
  IS_LOCAL_REPO=1
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
  echo "[ERROR] Neither Node.js nor Antigravity executable was found."
  echo "Install Antigravity or Node.js (https://nodejs.org) first and re-run."
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
    sudo env HOME="$HOME" ANTIGRAVITY_RESOURCES_DIR="$res_dir" RUDEX_ZIP_PATH="${RUDEX_ZIP_PATH:-}" "$RUNNER_BIN" "$target_script" "$@"
  else
    sudo env HOME="$HOME" ANTIGRAVITY_RESOURCES_DIR="$res_dir" RUDEX_ZIP_PATH="${RUDEX_ZIP_PATH:-}" ELECTRON_RUN_AS_NODE=1 ELECTRON_NO_ASAR=1 "$RUNNER_BIN" "$target_script" "$@"
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

DO_DRY_RUN=0
DO_STATUS=0
DO_PLUGIN_ONLY=0
DO_UNINSTALL=0
DO_REMOVE_PLUGIN=0
FORCE_CLOSE=0
NO_RESTART=0
[ "${RUDEX_PLUGIN_ONLY:-0}" = "1" ] && DO_PLUGIN_ONLY=1
[ "${RUDEX_NO_RESTART:-0}" = "1" ] && NO_RESTART=1

for arg in "$@"; do
  case "$arg" in
    --dry-run) DO_DRY_RUN=1 ;;
    --status) DO_STATUS=1 ;;
    --plugin-only) DO_PLUGIN_ONLY=1 ;;
    --uninstall) DO_UNINSTALL=1 ;;
    --remove-plugin) DO_REMOVE_PLUGIN=1 ;;
    --force|-f) FORCE_CLOSE=1 ;;
    --no-restart) NO_RESTART=1 ;;
  esac
done

TEMP_DIR=""
cleanup() {
  if [ -n "$TEMP_DIR" ] && [ -d "$TEMP_DIR" ]; then
    rm -rf "$TEMP_DIR" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

SOURCE_DIR=""
if [ "$IS_LOCAL_REPO" -eq 1 ]; then
  SOURCE_DIR="$SCRIPT_DIR"
else
  TEMP_DIR="$(mktemp -d 2>/dev/null || mktemp -d -t 'rudex-install')"
  ZIP_PATH="$TEMP_DIR/rudex.zip"
  EXTRACT_DIR="$TEMP_DIR/extracted"
  mkdir -p "$EXTRACT_DIR"
  ZIP_URL="https://github.com/$REPO_OWNER/$REPO_NAME/archive/refs/heads/$BRANCH.zip"

  echo "[Rudex] Downloading Rudex from $REPO_OWNER/$REPO_NAME ($BRANCH)..."
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$ZIP_URL" -o "$ZIP_PATH"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO "$ZIP_PATH" "$ZIP_URL"
  else
    echo "[ERROR] Neither curl nor wget is installed to download Rudex."
    exit 1
  fi

  if command -v unzip >/dev/null 2>&1; then
    unzip -qo "$ZIP_PATH" -d "$EXTRACT_DIR"
  elif [ "$OS_TYPE" = "Darwin" ] && command -v ditto >/dev/null 2>&1; then
    ditto -xk "$ZIP_PATH" "$EXTRACT_DIR"
  elif command -v python3 >/dev/null 2>&1; then
    python3 -m zipfile -e "$ZIP_PATH" "$EXTRACT_DIR"
  elif command -v python >/dev/null 2>&1; then
    python -m zipfile -e "$ZIP_PATH" "$EXTRACT_DIR"
  elif command -v bsdtar >/dev/null 2>&1; then
    bsdtar -xf "$ZIP_PATH" -C "$EXTRACT_DIR"
  elif command -v tar >/dev/null 2>&1; then
    tar -xf "$ZIP_PATH" -C "$EXTRACT_DIR"
  else
    echo "[ERROR] No unzip, ditto, python3, or tar available to extract Rudex archive."
    exit 1
  fi

  MANIFEST="$(find "$EXTRACT_DIR" -maxdepth 3 -name "plugin.json" | head -n 1)"
  if [ -z "$MANIFEST" ] || [ ! -f "$MANIFEST" ]; then
    echo "[ERROR] Failed to locate plugin.json inside downloaded archive."
    exit 1
  fi
  SOURCE_DIR="$(dirname "$MANIFEST")"
  export RUDEX_ZIP_PATH="$ZIP_PATH"
fi

INSTALL_JS="$SOURCE_DIR/skills/rudex/scripts/install.js"
UNINSTALL_JS="$SOURCE_DIR/skills/rudex/scripts/uninstall.js"

if [ "$DO_STATUS" -eq 1 ]; then
  run_js "$INSTALL_JS" --status
  exit 0
fi

if [ "$DO_DRY_RUN" -eq 1 ]; then
  run_js "$INSTALL_JS" --dry-run
  exit 0
fi

if [ "$DO_UNINSTALL" -eq 1 ]; then
  if [ -f "$SOURCE_DIR/uninstall.sh" ]; then
    if [ "$IS_LOCAL_REPO" -eq 1 ]; then
      exec bash "$SOURCE_DIR/uninstall.sh" "$@"
    else
      bash "$SOURCE_DIR/uninstall.sh" "$@"
      exit $?
    fi
  fi
  u_args=()
  [ "$DO_REMOVE_PLUGIN" -eq 1 ] && u_args+=(--remove-plugin)
  run_js "$UNINSTALL_JS" "${u_args[@]}"
  exit 0
fi

# 1. Sync skill/plugin files as the CURRENT user so ~/.gemini/config/plugins/rudex is never owned by root
echo "[Rudex] Installing skill into ~/.gemini/config/plugins/rudex..."
run_js "$INSTALL_JS" --plugin-only

if [ "$DO_PLUGIN_ONLY" -eq 1 ]; then
  echo "[Rudex] Skill installed (--plugin-only)."
  exit 0
fi

# 2. Detect Antigravity resources directory
RES_OUT="$(run_js "$INSTALL_JS" --print-resources 2>/dev/null || true)"
RES_DIR="$(printf '%s\n' "$RES_OUT" | sed -n 's/^RESOURCES_DIR=//p' | head -n 1)"
DETECTED_EXE="$(printf '%s\n' "$RES_OUT" | sed -n 's/^AGY_EXE=//p' | head -n 1)"
DETECTED_BUNDLE="$(printf '%s\n' "$RES_OUT" | sed -n 's/^APP_BUNDLE=//p' | head -n 1)"
[ -z "$AGY_BIN" ] && [ -n "$DETECTED_EXE" ] && AGY_BIN="$DETECTED_EXE"
[ -z "$AGY_BUNDLE" ] && [ -n "$DETECTED_BUNDLE" ] && AGY_BUNDLE="$DETECTED_BUNDLE"

if [ -z "$RES_DIR" ] || [ ! -d "$RES_DIR" ]; then
  echo "[WARN] Antigravity installation directory was not auto-detected."
  echo "Skill files are installed in ~/.gemini/config/plugins/rudex."
  echo "Re-run with: ANTIGRAVITY_RESOURCES_DIR=/path/to/antigravity/resources ./install.sh"
  exit 1
fi

# Guard against immutable read-only Snap / mounted AppImage filesystems
case "$RES_DIR" in
  /snap/*|/tmp/.mount_*)
    echo "[WARN] Antigravity is running from a read-only filesystem ($RES_DIR)."
    echo "Rudex skill files are installed in ~/.gemini/config/plugins/rudex."
    echo "To patch the UI, use a .deb/.rpm/tar.gz build or extract the AppImage (--appimage-extract) and set ANTIGRAVITY_RESOURCES_DIR."
    exit 0
    ;;
esac

# 3. Close Antigravity if running (unless invoked inside Antigravity itself or --no-restart)
WAS_RUNNING=0
if is_antigravity_running; then
  WAS_RUNNING=1
fi

if [ "$WAS_RUNNING" -eq 1 ] && ! is_inside_antigravity; then
  if [ "$NO_RESTART" -eq 0 ]; then
    if [ "$FORCE_CLOSE" -eq 1 ]; then
      echo "[Rudex] Closing running Antigravity process..."
      close_antigravity
    elif [ -t 0 ]; then
      printf "Antigravity is running. Close it now to apply Rudex cleanly? [Y/n] "
      read -r resp
      case "$resp" in
        [nN][oO]|[nN])
          echo "Continuing without closing Antigravity -- restart it manually afterward."
          WAS_RUNNING=0
          ;;
        *)
          echo "[Rudex] Closing Antigravity..."
          close_antigravity
          ;;
      esac
    else
      echo "[Rudex] Closing Antigravity briefly before patching..."
      close_antigravity
    fi
  fi
fi

# 4. Patch Antigravity resources (elevate ONLY for system resources dir if needed)
echo "[Rudex] Patching Antigravity UI ($RES_DIR)..."
if [ -w "$RES_DIR" ]; then
  run_js "$INSTALL_JS" --no-sync-plugin
elif command -v sudo >/dev/null 2>&1; then
  echo "[Rudex] Elevated permissions needed for $RES_DIR (requesting sudo)..."
  run_js_as_sudo "$RES_DIR" "$INSTALL_JS" --no-sync-plugin
else
  echo "[ERROR] No write permission to $RES_DIR and 'sudo' is unavailable."
  echo "Run as root or grant write permissions to $RES_DIR, then re-run."
  exit 1
fi

echo ""
echo "[Rudex] Rudex v5.5.5 installed cleanly!"

if [ "$WAS_RUNNING" -eq 1 ] && [ "$NO_RESTART" -eq 0 ] && ! is_inside_antigravity; then
  echo "[Rudex] Relaunching Antigravity..."
  if [ "$OS_TYPE" = "Darwin" ] && [ -n "$AGY_BUNDLE" ] && [ -d "$AGY_BUNDLE" ]; then
    open -a "$AGY_BUNDLE" >/dev/null 2>&1 || open "$AGY_BUNDLE" >/dev/null 2>&1 || true
  elif [ "$OS_TYPE" = "Darwin" ]; then
    open -a "Antigravity" >/dev/null 2>&1 || true
  elif [ -n "$AGY_BIN" ] && [ -x "$AGY_BIN" ]; then
    nohup "$AGY_BIN" >/dev/null 2>&1 &
  fi
else
  echo "[Rudex] Launch or restart Antigravity once to activate all updates."
fi

exit 0

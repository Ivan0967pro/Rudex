#!/bin/sh
# =============================================================================
# Rudex v5.5.0 -- POSIX Hook Runner for macOS & Linux
# Finds Node.js (including GUI-hidden Homebrew/nvm/volta/mise/asdf) or falls
# back to Antigravity's bundled Electron runtime with ELECTRON_RUN_AS_NODE=1.
# =============================================================================
SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)"
HOOK_JS="$SCRIPT_DIR/rudex-hook.js"

if [ ! -f "$HOOK_JS" ]; then
  printf '{}\n'
  exit 0
fi

find_node_bin() {
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
  latest_nvm=""
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

NODE_BIN="$(find_node_bin || true)"
if [ -n "$NODE_BIN" ] && [ -x "$NODE_BIN" ]; then
  exec "$NODE_BIN" "$HOOK_JS" "$@"
fi

AGY_BIN=""
if [ "$(uname -s)" = "Darwin" ]; then
  for cand in \
    "/Applications/Antigravity.app/Contents/MacOS/Antigravity" \
    "$HOME/Applications/Antigravity.app/Contents/MacOS/Antigravity" \
    "/Applications/Google Antigravity.app/Contents/MacOS/Google Antigravity" \
    "$HOME/Applications/Google Antigravity.app/Contents/MacOS/Google Antigravity"; do
    if [ -x "$cand" ]; then
      AGY_BIN="$cand"
      break
    fi
  done
else
  if command -v antigravity >/dev/null 2>&1; then
    AGY_BIN="$(command -v antigravity)"
  fi
  if [ -z "$AGY_BIN" ] || [ ! -x "$AGY_BIN" ]; then
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
        AGY_BIN="$cand"
        break
      fi
    done
  fi
fi

if [ -n "$AGY_BIN" ] && [ -x "$AGY_BIN" ]; then
  ELECTRON_RUN_AS_NODE=1 ELECTRON_NO_ASAR=1 exec "$AGY_BIN" "$HOOK_JS" "$@"
fi

printf '{}\n'
exit 0

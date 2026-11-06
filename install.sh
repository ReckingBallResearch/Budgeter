#!/bin/bash
# Budgeter installer: builds the Mac app from this folder and puts it in /Applications.
# Safe to run again; it updates the app and keeps your data.
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP="/Applications/Budgeter.app"
step(){ printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
fail(){ printf '\n\033[1;31mError: %s\033[0m\n' "$1"; exit 1; }

[ "$(uname)" = "Darwin" ] || fail "This installer is for macOS. On other systems, open app/index.html in your browser instead."
case "$(uname -m)" in arm64) ARCH=arm64 ;; x86_64) ARCH=x64 ;; *) fail "Unsupported Mac processor: $(uname -m)" ;; esac

# 1. Node.js 22 or newer, only needed to build the app
NODE_OK=0
if command -v node >/dev/null 2>&1; then
  [ "$(node -p 'process.versions.node.split(".")[0]')" -ge 22 ] && NODE_OK=1
fi
if [ $NODE_OK -eq 0 ]; then
  step "Installing Node.js (you'll be asked for your Mac password)"
  PKG=$(curl -fsSL https://nodejs.org/dist/latest-v22.x/ | grep -o 'node-v22[0-9.]*\.pkg' | head -1)
  [ -n "$PKG" ] || fail "Couldn't find the Node.js installer. Install it from https://nodejs.org and run this again."
  curl -fL "https://nodejs.org/dist/latest-v22.x/$PKG" -o "/tmp/$PKG"
  sudo installer -pkg "/tmp/$PKG" -target /
  rm -f "/tmp/$PKG"
  export PATH="/usr/local/bin:$PATH"
  command -v node >/dev/null 2>&1 || fail "Node.js didn't install. Install it from https://nodejs.org and run this again."
fi
echo "Node $(node -v)"

# 2. Build in this folder
cd "$SRC"
step "Installing build tools (first run takes a few minutes)"
npm install --no-audit --no-fund --loglevel=error
step "Building Budgeter for $ARCH"
rm -rf dist
CSC_IDENTITY_AUTO_DISCOVERY=false npx electron-builder --mac --"$ARCH" --dir >/tmp/budgeter-build.log 2>&1 || { tail -20 /tmp/budgeter-build.log; fail "Build failed. Full log: /tmp/budgeter-build.log"; }
BUILT=$(find dist -maxdepth 2 -name 'Budgeter.app' -type d | head -1)
[ -n "$BUILT" ] || fail "Build finished but Budgeter.app wasn't found in dist."

# 3. Install. The app isn't signed by a registered developer, so it's signed locally to open without warnings.
step "Installing to /Applications"
osascript -e 'tell application "Budgeter" to quit' >/dev/null 2>&1 || true
sleep 1
rm -rf "$APP" 2>/dev/null || sudo rm -rf "$APP"
cp -R "$BUILT" "$APP" 2>/dev/null || sudo cp -R "$BUILT" "$APP"
xattr -cr "$APP" 2>/dev/null || true
codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true

step "Done. Opening Budgeter."
open "$APP"
echo "To update later: get the latest version of this folder (git pull) and run: bash install.sh"

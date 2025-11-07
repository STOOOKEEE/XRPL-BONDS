#!/usr/bin/env bash
# Simple compile helper for XRPL Hooks C -> WASM -> HEX
# Requires clang-13 (or llvm 13) and binaryen (wasm-opt, wasm2wat, wat2wasm)

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <path-to-hook.c> [output-dir]"
  exit 1
fi

HOOK_C_PATH="$1"
OUT_DIR="${2:-build}"
mkdir -p "$OUT_DIR"

BASENAME=$(basename "$HOOK_C_PATH" .c)
WASM="$OUT_DIR/${BASENAME}.wasm"
OPT_WASM="$OUT_DIR/${BASENAME}.opt.wasm"
HEX_OUT="$OUT_DIR/${BASENAME}.hex"

echo "Compiling $HOOK_C_PATH -> $WASM"

# Example clang command for wasm32. Adjust include paths to the Hooks SDK on your machine.
clang-13 --target=wasm32 -O2 -nostdlib -Wl,--no-entry -Wl,--export-dynamic -o "$WASM" "$HOOK_C_PATH" || {
  echo "clang-13 failed. Ensure clang-13 is installed and in PATH (brew install llvm@13)"
  exit 2
}

if command -v wasm-opt >/dev/null 2>&1; then
  echo "Optimizing wasm -> $OPT_WASM"
  wasm-opt -O2 "$WASM" -o "$OPT_WASM"
  wasm2wat "$OPT_WASM" -o - | wasm-as - -o "$OPT_WASM" || true
else
  OPT_WASM="$WASM"
fi

if command -v wasm2wat >/dev/null 2>&1 && command -v wat2wasm >/dev/null 2>&1; then
  echo "Converting to hex (wasm -> hex)"
  # Convert wasm to hex blob expected by hooks tooling (tooling may expect raw wasm in hex)
  xxd -p "$OPT_WASM" | tr -d '\n' > "$HEX_OUT"
  echo "Wrote $HEX_OUT"
else
  echo "Skipping hex conversion: wasm2wat/wat2wasm not found. Output wasm at: $OPT_WASM"
fi

echo "Done."

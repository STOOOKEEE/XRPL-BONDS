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

# Try Homebrew LLVM first
if [ -x "/opt/homebrew/opt/llvm/bin/clang" ]; then
  CLANG="/opt/homebrew/opt/llvm/bin/clang"
  echo "Using Homebrew LLVM clang"
else
  echo "Error: Homebrew LLVM not found. Install with: brew install llvm"
  exit 2
fi

# Compile to wasm32 with correct flags
$CLANG --target=wasm32 \
  -nostdlib \
  -ffreestanding \
  -O3 \
  -Wl,--no-entry \
  -Wl,--export-all \
  -Wl,--allow-undefined \
  -o "$WASM" \
  "$HOOK_C_PATH" || {
  echo "Compilation failed. Trying alternative method..."
  
  # Alternative: compile to object file first
  OBJ="$OUT_DIR/${BASENAME}.o"
  $CLANG --target=wasm32 \
    -nostdlib \
    -ffreestanding \
    -O3 \
    -c \
    -o "$OBJ" \
    "$HOOK_C_PATH" || {
    echo "ERROR: Compilation failed completely"
    exit 2
  }
  
  # Link with wasm-ld if available
  WASM_LD=""
  if [ -x "/opt/homebrew/bin/wasm-ld" ]; then
    WASM_LD="/opt/homebrew/bin/wasm-ld"
  elif [ -x "/opt/homebrew/opt/lld/bin/wasm-ld" ]; then
    WASM_LD="/opt/homebrew/opt/lld/bin/wasm-ld"
  fi
  
  if [ -n "$WASM_LD" ]; then
    echo "Linking with $WASM_LD..."
    $WASM_LD \
      --no-entry \
      --export-all \
      --allow-undefined \
      -o "$WASM" \
      "$OBJ" || {
      echo "ERROR: Linking failed"
      exit 2
    }
  else
    echo "ERROR: wasm-ld not found in /opt/homebrew/bin or /opt/homebrew/opt/lld/bin"
    exit 2
  fi
}

if command -v wasm-opt >/dev/null 2>&1; then
  echo "Optimizing wasm -> $OPT_WASM"
  wasm-opt -O3 "$WASM" -o "$OPT_WASM"
  # Don't use wasm2wat/wasm-as round-trip, it can break things
else
  OPT_WASM="$WASM"
fi

if command -v xxd >/dev/null 2>&1; then
  echo "Converting to hex (wasm -> hex)"
  # Convert wasm to hex blob (use the non-optimized or lightly optimized wasm)
  xxd -p "$WASM" | tr -d '\n' > "$HEX_OUT"
  echo "Wrote $HEX_OUT"
else
  echo "Skipping hex conversion: xxd not found. Output wasm at: $WASM"
fi

echo "Done."

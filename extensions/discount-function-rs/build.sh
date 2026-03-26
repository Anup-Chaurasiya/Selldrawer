#!/bin/bash

# Check if WASM file exists and is newer than source files
WASM_FILE="dist/function.wasm"
SRC_FILES="src/*.js"

if [ -f "$WASM_FILE" ]; then
  # Check if any source file is newer than WASM
  NEEDS_BUILD=false
  for src in $SRC_FILES; do
    if [ "$src" -nt "$WASM_FILE" ]; then
      NEEDS_BUILD=true
      break
    fi
  done
  
  if [ "$NEEDS_BUILD" = false ]; then
    echo "✓ WASM file is up to date"
    exit 0
  fi
fi

# Try to build with Shopify CLI
echo "Building function..."
if command -v javy &> /dev/null; then
  npm exec -- shopify app function build
else
  echo "⚠️  Javy not found. Using existing WASM file."
  echo "   To rebuild, install Javy: https://github.com/bytecodealliance/javy"
  
  # Check if WASM exists
  if [ ! -f "$WASM_FILE" ]; then
    echo "❌ No WASM file found and cannot build without Javy"
    exit 1
  fi
fi

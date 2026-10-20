#!/usr/bin/env bash
# Pre-bundles @cursor/sdk into one CommonJS file Raycast's bundler can handle.
# Why: the SDK's default entry loads chunks with a dynamic import that esbuild turns into a directory glob
# (pulls in .d.ts and .map files). The single-file "bundled" entry avoids that but targets Bun, so we
# stub bun:sqlite (we pass a JSONL store) and map import.meta.require to require.
set -euo pipefail
cd "$(dirname "$0")/.."
npx esbuild node_modules/@cursor/sdk/dist/bundled/index.js \
  --bundle --platform=node --format=cjs \
  --alias:bun:sqlite=./src/stubs/bun-sqlite.ts \
  --define:import.meta.require=require --minify \
  --outfile=src/vendor/cursor-sdk.js --log-level=warning

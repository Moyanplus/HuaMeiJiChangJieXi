#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

mkdir -p BIN/_exports/bin1/data BIN/_exports/bin1/scripts BIN/_logs/backend

# Move bin1 data exports into BIN/_exports
if [ -d bin1/data/exports ]; then
  mkdir -p BIN/_exports/bin1/data/exports
  find bin1/data/exports -mindepth 1 -maxdepth 1 -print0 \
    | xargs -0 -I{} mv "{}" "BIN/_exports/bin1/data/exports/"
fi

# Move bin1 generated data into BIN/_exports
if [ -d bin1/data/generated ]; then
  mkdir -p BIN/_exports/bin1/data/generated
  find bin1/data/generated -mindepth 1 -maxdepth 1 -print0 \
    | xargs -0 -I{} mv "{}" "BIN/_exports/bin1/data/generated/"
fi

# Move export outputs from scripts into BIN/_exports
find bin1/scripts -maxdepth 1 -type f \( -name "*.csv" -o -name "*.xlsx" -o -name "*.json" \) \
  ! -name "package.json" ! -name "package-lock.json" -print0 \
  | xargs -0 -I{} mv "{}" "BIN/_exports/bin1/scripts/" || true

# Recreate expected output directories
mkdir -p bin1/data/exports
mkdir -p bin1/data/generated/codes bin1/data/generated/lounges bin1/data/generated/intermediate
mkdir -p bin1/data/temp

# Prune logs: gzip older logs, remove very old gz files
for dir in backend/logs BIN/_logs/backend; do
  if [ -d "$dir" ]; then
    find "$dir" -type f -name "*.log" -mtime +7 -exec gzip -f {} \;
    find "$dir" -type f -name "*.gz" -mtime +90 -delete
  fi
done

# Remove heavy dependencies (reinstall when needed)
rm -rf backend/node_modules bin1/scripts/node_modules

echo "cleanup complete"

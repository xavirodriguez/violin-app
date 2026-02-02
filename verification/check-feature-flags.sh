#!/bin/bash

# Script to verify architectural consistency of the Feature Flag system.
# It ensures all flags defined in lib/feature-flags.ts are correctly exposed and handled.

FLAGS_METADATA_FILE="lib/feature-flags.ts"
NEXT_CONFIG_FILE="next.config.mjs"
ENV_EXAMPLE_FILE=".env.example"

errors=0

echo "🔍 Checking Feature Flag consistency..."

# 1. Extract flags from FEATURE_FLAGS_METADATA
# We look for lines like "  FEATURE_NAME: {"
FLAGS=$(grep -oE "FEATURE_[A-Z_]+" "$FLAGS_METADATA_FILE" | sort | uniq)

for flag in $FLAGS; do
  # Skip type definitions or other non-flag matches if any
  if [[ "$flag" == "FEATURE_FLAGS_METADATA" ]]; then continue; fi

  echo "  - Checking $flag..."

  # 2. Check if in next.config.mjs
  if ! grep -q "$flag" "$NEXT_CONFIG_FILE"; then
    echo "    ❌ Missing in $NEXT_CONFIG_FILE"
    errors=$((errors + 1))
  fi

  # 3. Check if in getClientValue switch-case
  if ! grep -q "case '$flag':" "$FLAGS_METADATA_FILE"; then
    echo "    ❌ Missing in getClientValue switch-case in $FLAGS_METADATA_FILE"
    errors=$((errors + 1))
  fi

  # 4. Check if in .env.example (standard and NEXT_PUBLIC_)
  if ! grep -q "^$flag=" "$ENV_EXAMPLE_FILE"; then
    echo "    ❌ Missing standard version in $ENV_EXAMPLE_FILE"
    errors=$((errors + 1))
  fi
  if ! grep -q "^NEXT_PUBLIC_$flag=" "$ENV_EXAMPLE_FILE"; then
    echo "    ❌ Missing NEXT_PUBLIC_ version in $ENV_EXAMPLE_FILE"
    errors=$((errors + 1))
  fi
done

if [ $errors -eq 0 ]; then
  echo "✅ Feature Flag consistency check passed!"
  exit 0
else
  echo "❌ Feature Flag consistency check failed with $errors errors."
  exit 1
fi

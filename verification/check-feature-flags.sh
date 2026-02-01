#!/bin/bash
# Feature Flag Consistency Checker
# Ensures that all flags defined in lib/feature-flags.ts are exposed in next.config.mjs

METADATA_FLAGS=$(grep -E "FEATURE_[A-Z_]+:" lib/feature-flags.ts | sed 's/ //g' | cut -d':' -f1)
CONFIG_FILE="next.config.mjs"
MISSING_COUNT=0

echo "🔍 Checking Feature Flag consistency..."

for FLAG in $METADATA_FLAGS; do
  STATUS="✅ OK"

  if ! grep -q "$FLAG" "$CONFIG_FILE"; then
    echo "❌ ERROR: Flag '$FLAG' is missing from $CONFIG_FILE"
    MISSING_COUNT=$((MISSING_COUNT + 1))
    STATUS="❌ FAILED"
  fi

  if ! grep -q "case '$FLAG':" lib/feature-flags.ts; then
    echo "❌ ERROR: Flag '$FLAG' is missing from getClientValue switch in lib/feature-flags.ts"
    MISSING_COUNT=$((MISSING_COUNT + 1))
    STATUS="❌ FAILED"
  fi

  if [ "$STATUS" == "✅ OK" ]; then
    echo "✅ OK: $FLAG"
  fi
done

if [ $MISSING_COUNT -eq 0 ]; then
  echo "✨ All feature flags are correctly exposed in $CONFIG_FILE"
  exit 0
else
  echo "⚠️ Found $MISSING_COUNT consistency errors."
  exit 1
fi

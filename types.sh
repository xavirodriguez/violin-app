find types-docs -type f -name "*.d.ts" | sort | while read f; do
  echo ""
  echo "// ===== ${f#types-doc/} ====="
  echo ""
  cat "$f"
done > total.d.ts
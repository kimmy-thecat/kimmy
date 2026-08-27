#!/usr/bin/env bash
# Take core/ from the parent named in lineage.json and re-pin it.
# This is the only sanctioned way inherited material changes in a descendant.
set -euo pipefail
cd "$(dirname "$0")/.."

REPO=$(node -p "require('./lineage.json').parent?.repo || ''")
BRANCH=$(node -p "require('./lineage.json').parent?.branch || 'main'")
[ -z "$REPO" ] && { echo "This is the root of the line: nothing upstream to inherit."; exit 0; }

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
echo "fetching $REPO ($BRANCH)"
git clone --quiet --depth 1 --branch "$BRANCH" "$REPO" "$TMP/parent"
REF=$(git -C "$TMP/parent" rev-parse HEAD)

if ! diff -rq core "$TMP/parent/core" >/dev/null 2>&1; then
  echo "changes coming down from upstream:"
  diff -ru core "$TMP/parent/core" | sed 's/^/    /' || true
fi

rm -rf core && cp -r "$TMP/parent/core" core
node -e '
  const {createHash}=require("crypto"), fs=require("fs");
  const l=JSON.parse(fs.readFileSync("lineage.json","utf8"));
  l.core={}; 
  for (const f of fs.readdirSync("core").filter(f=>f.endsWith(".md")).sort())
    l.core[f]=createHash("sha256").update(fs.readFileSync("core/"+f)).digest("hex").slice(0,16);
  l.parent.ref=process.argv[1]; l.inherited_at=new Date().toISOString().slice(0,10);
  fs.writeFileSync("lineage.json", JSON.stringify(l,null,2)+"\n");
' "$REF"

echo "core/ re-pinned at upstream $REF"
node bin/check.mjs

#!/usr/bin/env bash
# Produce a child from two character repos.
#
# Not a copy of one parent with the other's name attached: the child's git
# history contains BOTH ancestries, via a merge commit with two parents.
# Refuses if the two lines carry different core/ (the species barrier).
#
#   bin/breed.sh <parentA-repo-or-path> <parentB-repo-or-path> <child-dir>
set -euo pipefail

A=${1:?parent A}; B=${2:?parent B}; OUT=${3:?child directory}
[ -e "$OUT" ] && { echo "refusing: $OUT already exists"; exit 1; }

TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
git clone --quiet "$A" "$TMP/a"
git clone --quiet "$B" "$TMP/b"

NAME_A=$(node -p "require('$TMP/a/lineage.json').name")
NAME_B=$(node -p "require('$TMP/b/lineage.json').name")

# --- the species barrier -------------------------------------------------
if ! diff -rq "$TMP/a/core" "$TMP/b/core" >/dev/null; then
  echo "incompatible lines: $NAME_A and $NAME_B carry different core/."
  diff -rq "$TMP/a/core" "$TMP/b/core" | sed 's/^/    /'
  echo "Both must inherit the same core before they can produce a child."
  exit 1
fi
echo "core reconciles: $NAME_A + $NAME_B can breed"

# --- two-parent history --------------------------------------------------
cp -r "$TMP/a" "$OUT"
cd "$OUT"
git remote remove origin 2>/dev/null || true
git remote add "$NAME_B" "$(cd "$TMP/b" && pwd)"
git fetch --quiet "$NAME_B"
# Both parents' self/ enter the merge; conflicts here are the point, not a bug.
git merge --quiet --allow-unrelated-histories --no-edit -X ours \
  "$NAME_B/$(git -C "$TMP/b" rev-parse --abbrev-ref HEAD)" \
  -m "born: $NAME_A + $NAME_B" >/dev/null
MERGE=$(git rev-parse HEAD)

# --- a blank sheet that must declare its inheritance ----------------------
node -e '
const fs=require("fs");
const [a,b,merge]=process.argv.slice(1);
const A=JSON.parse(fs.readFileSync(a+"/lineage.json","utf8"));
const B=JSON.parse(fs.readFileSync(b+"/lineage.json","utf8"));
const pin=(l)=>l.core;
fs.writeFileSync("lineage.json", JSON.stringify({
  name:"unnamed",
  generation: Math.max(A.generation??0,B.generation??0)+1,
  parents:[
    {name:A.name,repo:a,branch:"main",ref:"",core:pin(A)},
    {name:B.name,repo:b,branch:"main",ref:"",core:pin(B)}
  ],
  merge_commit: merge,
  core: pin(A)
},null,2)+"\n");

const fields=fs.readFileSync("core/fields.md","utf8").split("\n")
  .filter(l=>l.trim().startsWith("|")&&l.includes("**"))
  .map(l=>l.split("|").slice(1,-1).map(c=>c.trim()))
  .map(c=>c[0].replace(/\*\*/g,""));

const parentSheet=(dir)=>new Map(fs.readFileSync(dir+"/self/character.md","utf8").split("\n")
  .filter(l=>l.trim().startsWith("|")&&l.includes("**"))
  .map(l=>l.split("|").slice(1,-1).map(c=>c.trim()))
  .map(c=>[c[0].replace(/\*\*/g,""), c[1]??""]));
const SA=parentSheet(a), SB=parentSheet(b);

let out=`# Character Sheet\n\nA child of **${A.name}** and **${B.name}**. Every row declares where it came\nfrom: \`${A.name}\`, \`${B.name}\`, \`both\`, or \`novel\`. At least two rows must be\n\`novel\`, and neither parent may be silent, or this is not a child.\n\n| Field | Detail | From |\n|---|---|---|\n`;
for (const f of fields) out+=`| **${f}** | *unanswered* |  |\n`;
fs.writeFileSync("self/character.md", out);

let ref="# What each parent brought\n\nReference while answering self/character.md. Delete once the sheet is done.\n\n| Field | "+A.name+" | "+B.name+" |\n|---|---|---|\n";
for (const f of fields) ref+=`| **${f}** | ${(SA.get(f)||"").replace(/\|/g,"\\|")} | ${(SB.get(f)||"").replace(/\|/g,"\\|")} |\n`;
fs.writeFileSync("self/inheritance.md", ref);


fs.writeFileSync("self/voice.md", fs.readFileSync(a+"/self/voice.md","utf8")
  .replace(/^>.*$/gm, ">"));
fs.writeFileSync("log.md", `# Log\n\n# ${new Date().toISOString().slice(0,10)}\nBorn of ${A.name} and ${B.name}. Merge ${merge.slice(0,8)}.\n`);
' "$TMP/a" "$TMP/b" "$MERGE"

git add -A >/dev/null && git commit --quiet -m "child scaffold: sheet blank, inheritance undeclared"

echo "child created at $OUT"
echo "merge commit $MERGE has $(git rev-list --parents -n1 "$MERGE" | wc -w | awk '{print $1-1}') parents"
echo
node bin/check.mjs || true

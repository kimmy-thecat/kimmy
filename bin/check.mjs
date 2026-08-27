#!/usr/bin/env node
// Verifies a character repo against the line(s) it belongs to.
//
// One parent  = a clone. It can only drift from its parent.
// Two parents = a child. Its git history holds both ancestries, its core had
//               to reconcile, and every field on its sheet declares where it
//               came from. A sheet that takes everything from one side is a
//               clone wearing a second surname, and fails.
//
// No dependencies. Exit 1 on error.

import { createHash } from "node:crypto";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const warnings = [];
const sha = (p) => createHash("sha256").update(readFileSync(p)).digest("hex").slice(0, 16);
const read = (p) => readFileSync(join(ROOT, p), "utf8");

if (!existsSync(join(ROOT, "lineage.json"))) {
  console.error("fatal: lineage.json missing. A character must know where it came from.");
  process.exit(1);
}
const lineage = JSON.parse(read("lineage.json"));

// parents: [] root, [a] clone, [a,b] child. The old single-parent shape still works.
let parents = lineage.parents ?? (lineage.parent?.repo ? [lineage.parent] : []);
parents = parents.filter((p) => p && p.repo);
if (parents.length > 2) {
  errors.push(`${parents.length} parents declared. Two is the ceiling; more is a committee, not a bloodline.`);
}

// ---------- core integrity ----------
const coreFiles = readdirSync(join(ROOT, "core")).filter((f) => f.endsWith(".md")).sort();
const pinned = lineage.core ?? {};

for (const f of coreFiles) {
  const actual = sha(join(ROOT, "core", f));
  if (!(f in pinned)) errors.push(`core/${f} is not pinned in lineage.json. Inherited material is not added locally.`);
  else if (pinned[f] !== actual) errors.push(`core/${f} has drifted. pinned ${pinned[f]}, on disk ${actual}. Run bin/inherit.sh.`);
}
for (const f of Object.keys(pinned)) {
  if (!coreFiles.includes(f)) errors.push(`core/${f} is pinned but missing. Deleting inherited material leaves the line.`);
}

// ---------- the species barrier ----------
// Two lines can only produce a child if their inherited core reconciles.
// Checked when they breed, recorded per parent, re-checked here so it cannot
// rot quietly afterwards.
if (parents.length === 2) {
  const [a, b] = parents;
  if (!a.core || !b.core) {
    errors.push("a two-parent child must record each parent's core hashes as of the merge; without them the reconciliation cannot be re-verified.");
  } else {
    for (const k of new Set([...Object.keys(a.core), ...Object.keys(b.core)])) {
      if (a.core[k] !== b.core[k]) {
        errors.push(`incompatible lines: core/${k} differs between ${a.name ?? a.repo} (${a.core[k] ?? "absent"}) and ${b.name ?? b.repo} (${b.core[k] ?? "absent"}). These two cannot produce a child until both carry the same core.`);
      }
      // Deliberately not compared against pinned[k]. The parents' hashes are a
      // record of what reconciled at the merge, not a ceiling on what the child
      // may inherit afterwards. Comparing them to today's disk made bin/inherit.sh
      // impossible for a two-parent child: an upstream core change turned the
      // sanctioned path into a red build. Drift is still caught, above, against
      // lineage.core.
    }
  }
  if (!lineage.merge_commit) {
    warnings.push("no merge_commit recorded: nothing proves this history actually contains both ancestries.");
  }
}

// ---------- parse tables ----------
const rows = (md) =>
  md.split("\n")
    .filter((l) => l.trim().startsWith("|") && l.includes("**"))
    .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()))
    .filter((c) => c.length >= 2);

const schema = rows(read("core/fields.md")).map((c) => ({
  name: c[0].replace(/\*\*/g, ""),
  required: (c[2] ?? "yes").toLowerCase() !== "no",
}));

const sheet = new Map(
  rows(read("self/character.md")).map((c) => [
    c[0].replace(/\*\*/g, ""),
    { answer: c[1] ?? "", from: (c[2] ?? "").replace(/\*\*/g, "").trim() },
  ])
);

const placeholder = (s) => {
  const bare = (s ?? "").replace(/[*_`]/g, "").trim();
  return !bare || /^(unanswered|tbd|todo|none|-|\?)$/i.test(bare);
};

for (const field of schema) {
  const row = sheet.get(field.name);
  if (!row) {
    (field.required ? errors : warnings).push(`self/character.md is missing "${field.name}". Upstream asks it; this character has not answered.`);
    continue;
  }
  if (placeholder(row.answer)) {
    (field.required ? errors : warnings).push(`"${field.name}" is a placeholder, not an answer.`);
  }
}
for (const name of sheet.keys()) {
  if (!schema.some((f) => f.name === name)) {
    warnings.push(`sheet answers "${name}", which is not in the schema. Invented fields propagate to nobody; PR it into upstream core/fields.md.`);
  }
}

// ---------- recombination ----------
let recombination = "";
if (parents.length === 2) {
  const valid = new Set([...parents.map((p) => (p.name ?? "").toLowerCase()), "novel", "both"]);
  const tally = {};
  for (const field of schema) {
    const row = sheet.get(field.name);
    if (!row) continue;
    const from = row.from.toLowerCase();
    if (!from) {
      if (field.required) errors.push(`"${field.name}" does not declare a source. A child's sheet says where each answer came from.`);
      continue;
    }
    if (!valid.has(from)) {
      errors.push(`"${field.name}" is inherited from "${row.from}", who is not a parent of this character. Valid: ${[...valid].join(", ")}.`);
      continue;
    }
    tally[from] = (tally[from] ?? 0) + 1;
  }

  const novel = tally["novel"] ?? 0;
  const shared = tally["both"] ?? 0;
  // "both" is a contribution from each side, not a third parent.
  const sides = parents.map((p) => ({ name: p.name, solo: tally[(p.name ?? "").toLowerCase()] ?? 0, count: (tally[(p.name ?? "").toLowerCase()] ?? 0) + shared }));
  const silent = sides.filter((s) => s.count === 0);

  if (Object.keys(tally).length) {
    if (silent.length) {
      errors.push(`nothing on this sheet came from ${silent.map((s) => s.name).join(" or ")}. That is a clone of the other parent with a second surname on the paperwork.`);
    }
    if (novel < 2) {
      errors.push(`only ${novel} field(s) are the child's own. A pure recombination of two parents is a remix, not a person: at least two answers must be novel.`);
    }
    recombination = `recombination: ${sides.map((s) => `${s.name} ${s.solo}`).join(" · ")} · both ${shared} · novel ${novel}`;
  }
}

// ---------- report ----------
const kind = parents.length === 0 ? "root" : parents.length === 1 ? "clone" : "child";
const of = parents.length ? ` of ${parents.map((p) => p.name ?? p.repo).join(" + ")}` : "";
console.log(`character: ${lineage.name ?? "unnamed"}  gen ${lineage.generation ?? "?"}  ${kind}${of}`);
console.log(`core: ${coreFiles.length} inherited files, ${Object.keys(pinned).length} pinned`);
console.log(`sheet: ${sheet.size} answered / ${schema.filter((f) => f.required).length} required`);
if (recombination) console.log(recombination);
console.log();

for (const w of warnings) console.log(`  warn  ${w}`);
for (const e of errors) console.log(`  FAIL  ${e}`);

if (errors.length) {
  console.log(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log(warnings.length ? `\nok, with ${warnings.length} warning(s).` : "\nok.");

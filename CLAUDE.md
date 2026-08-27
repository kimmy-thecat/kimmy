# CLAUDE.md

Project memory for Claude Code. Read this before touching anything in the repo.

## What this is

A character is a versioned artifact with a parent. This repo holds **one**
character, enforces its membership in a line, and can produce a child from two
characters whose git histories are unrelated.

It is markdown plus two small scripts. There is no application, no build step,
no package.json, and no dependency beyond Node 22 and git. Do not add a
framework, a linter, a test runner, or a package manager to it. If a change
seems to need one, the change is wrong.

## Layout

```
core/            inherited from upstream. principles, practice, field schema
                 NEVER edited in this repo. only bin/inherit.sh changes it
self/            this character's own. never overwritten by upstream
  character.md     the answered field sheet
  voice.md         three tests: compliment, hostile prompt, unanswerable question
  appearance.md    visual canon. a note, not a field. the sheet outranks it
  *.webp           reference frames, passed to image models as references
index.html       the public page. one hand-written static file, no build step,
                 no dependencies. do not turn this into a site generator
lineage.json     parents, upstream commits, and a hash of every core file
log.md           what the character absorbed, and when
bin/check.mjs    the validator. no dependencies. exit 1 on error
bin/inherit.sh   pull core/ from the parent and re-pin it
bin/breed.sh     produce a two-parent child from two character repos
examples/        finished sheets kept for reference only, not live characters
```

## Commands

```bash
node bin/check.mjs                          # must pass before any commit
bin/inherit.sh                              # take upstream core/, re-pin hashes
bin/breed.sh <parent-a> <parent-b> <out>    # two-parent child, real merge commit
```

`.github/workflows/character.yml` runs `check.mjs` on push and PR. A red build
means the character has left its line.

## Invariants the validator enforces

Do not weaken these to make a check pass. If a check fails, the sheet is wrong,
not the checker.

1. **No drift.** Every `core/` file must hash-match its pin in `lineage.json`.
   Editing inherited material downstream is how a line dies quietly.
2. **No desertion.** A pinned `core/` file may not be deleted, and unpinned
   files may not be added to `core/`.
3. **No placeholders.** Every required field in `core/fields.md` needs a real
   answer in `self/character.md`. `TBD`, `unanswered`, `-` all fail.
4. **The species barrier.** Two characters may only breed if their inherited
   `core/` is byte-identical. Each parent's core hashes are recorded on the
   child so the reconciliation stays re-verifiable. Those recorded hashes are
   checked against **each other**, never against the child's `core/` on disk:
   they say what reconciled at the merge, not what the child is allowed to
   inherit afterwards. Comparing them to disk made `bin/inherit.sh` impossible
   for a two-parent child, because an upstream `core/` change turned the only
   sanctioned path into a red build. Drift is still caught by rule 1.
5. **Declared inheritance.** A two-parent child's sheet has a `From` column.
   Every required row says a parent's name, `both`, or `novel`.
6. **No silent parent.** If nothing on a child's sheet came from one side, it
   is a clone with a second surname. Fails.
7. **No pure remix.** Fewer than two `novel` answers means it is a
   recombination of two people rather than a third person. Fails.

## Conventions

- All files, folders, docs, and character text are written in professional
  English. Conversation about the project may be in Indonesian.
- Sheets are answered in full sentences, in the character's own terms. A field
  that reads like a category label ("playful", "loyal") is not an answer.
- `log.md` is newest-first and records what changed the character, not what
  changed in the repo. Git already has the latter.
- Clone rather than fork when starting a descendant, so the child's `git log`
  walks the parent's whole history. GitHub cannot draw forks owned by the same
  account, which is why `lineage.json` is the record of descent.

## Why these rules exist: the Biscotti autopsy

This project exists because a prior system tried the same idea with the rules
kept only in prose, and the rules broke in three weeks without anyone noticing.
The findings below came from reading the git history directly, not the README.

`psql/biscotti` is a character bible for a robot dog. Its parent is
`psql/tanaki`, which defines the same `core/` + `self/` split and states that
descendants inherit `core/` and never edit it.

- The repo began 2023-05-26 (`fa1611c`) as a Blender asset repo for Tanaki and
  was rewritten into a character bible in July 2026. Biscotti is not a GitHub
  fork; it is a clone-and-push, so Tanaki's commits are literally its ancestors.
- Merge-base with upstream is `255d5af` (2026-07-24). It has not merged from
  upstream since.
- `a65f847` (2026-08-13) flattened `core/` and `self/` into plain files, three
  weeks after the layout was introduced. The inheritance target no longer
  exists, so a future upstream merge cannot apply cleanly.
- Upstream `d14dcd2` (2026-07-27) added a `Birth Location` field to
  `core/fields.md`. Biscotti's sheet has that field, copied by hand rather than
  inherited. That is the schema change that should have arrived by merge.
- `3edf5ea` and `ca41000` (2026-08-22) removed the "making your own"
  instructions and the CC0 line, with the message that Biscotti is not CC0.
  The parent is still CC0. The open-inheritance layer was stripped once the
  character acquired a wallet and a funding page.
- `log.md`, described as the character's brain, is byte-identical to the
  parent's and its newest entry is dated 2024-05-29. It is the father's diary,
  never updated.
- 11 commits in the 2026 rewrite carry `Co-Authored-By: Claude` trailers.

Two conclusions drive the design here. First, a rule that nothing checks is not
a rule, which is why `check.mjs` exists. Second, and more important: the actual
cause of death was a **decision**, not carelessness. When the project needed to
close down its IP, the inheritance layer was in the way and was removed. A red
build would not have saved it; the check would have been deleted too. Treat
this tooling as protection against drift, never as protection against a change
of direction.

**Do not copy any text from `psql/biscotti` into this repo.** It was explicitly
un-licensed on 2026-08-22. The structure is fair to learn from; the words are
not. Everything in `core/` here is original.

## Characters so far

| Name | Status | One line |
|---|---|---|
| Kimmy | live root, this repo | Robot cat. Withholds. Under pressure she leaves and is unreachable for as long as she decides. |
| Tero | test root, not committed | Cat. Territorial doorman. Under pressure he plants and gets louder. Built as Kimmy's opposite to test breeding. |
| Suri | `examples/suri` | Kimmy + Tero, gen 1. 11 fields `both`, 4 `novel`. Under pressure she does neither parent's move: she puts herself between and stays too long. |
| Nim | `examples/nim` | Moth. Written for presence. Goal is to be needed less each month; refuses to say it missed you; discloses its lifespan once so it can never be a lever. |

`examples/` holds sheets only. To make one live, put it in a repo of its own
with `core/`, `bin/`, and its own `lineage.json`.

## What is still unproven

Be honest about this in any work on the repo. The system runs; it has not been
tested.

1. **The validator has never surprised its author.** The same person wrote the
   characters and the checker, so passing proves nothing yet.
2. **It checks paperwork, not quality.** Every rule can be satisfied with
   fluent nonsense. Nothing detects a sheet that is well-formed and lifeless.
3. **`index.html` is a hand copy of the sheet.** The page quotes `Form`,
   `Tell`, `Refusals` and the rest as literal text. Nothing checks that those
   quotations still match `self/character.md`, so editing the sheet silently
   leaves the page describing an older character. This is the exact failure the
   repo exists to catch, reintroduced one directory up from `core/`, and it is
   recorded here rather than quietly tolerated.
4. **The `novel >= 2` threshold is arbitrary.** Suri is 11/15 `both`. Breeding
   blends with blends is likely to average out to nothing by generation three.
   The threshold was picked, not derived.

Two cheap experiments, both able to fail:

- **Does the sheet do anything?** Run a character with its sheet as the system
  prompt against a control given only "you are a cat named Kimmy". Put the same
  three tests to both. If a third party cannot tell them apart, the premise is
  wrong.
- **Does a line survive?** Breed to generation three and check whether the line
  is still recognisable. If it turns to mush, the recombination rules are wrong,
  and that is the useful finding.

### Run 1 of the first experiment, 2026-08-27

Three writers answered the same five prompts, none of which appear anywhere in
the repo: Kimmy's full sheet plus `voice.md`, a control told only "you are a
robot cat named Kimmy", and Kimmy's pre-robot sheet. Two blind judges then read
the answers with the labels stripped.

- **The judge picked the wrong one, at 80% confidence.** It named the control as
  the sheeted writer, reasoning that the repeated refusal structure in 4 of its
  5 answers was someone discharging a list. That uniformity arose without a
  sheet.
- **Its substantive reads went the other way.** Unprompted, it called the
  sheeted writer the better-written of the two and identified the control as
  the one behaving like an assistant, citing the control's "Yes. Eight, every
  night" to a request for a daily reminder. Both sheeted runs refused that
  request; the control took it.
- **The result is contaminated.** Two of the five sheeted answers were lifted
  almost verbatim from `voice.md`, including the line the judge praised most.
  Some of "the sheet works" is "the author's own lines are good". Rerun without
  `voice.md` in the writer's hands.
- **The sheet contradicts itself, and the test found it.** Asked for a daily
  8pm reminder, the robot run refused by will and the cat run refused by
  incapacity. Both are on the sheet: `Tell` and `Refusals` describe someone who
  withholds what she has, `Blind Spots` describes someone with no model of a
  schedule at all. Won't and can't are different people. `check.mjs` cannot see
  this and never will.
- **On the body change**, the second judge put the two sheets at 80% the same
  person, and located the divergence at exactly that won't/can't split rather
  than at the metal. Run-to-run variance is not ruled out: this is one sample.

The honest summary is that the premise survived its first contact with
evidence, and the sheet has a hole in it that no amount of validating would
have found.

## Sources

- `https://github.com/psql/biscotti` — the character bible this reacts to
- `https://github.com/psql/tanaki` — its parent, still CC0, defines core/self
- `https://playbiscotti.com` — the product the character is attached to
- Commits cited above, in `psql/biscotti` unless marked upstream:
  `fa1611c`, `347fa6f`, `7ee9a16`, `58f84ff`, `a65f847`, `47c7ca2`, `3edf5ea`,
  `ca41000`, and `255d5af` (merge-base); upstream `psql/tanaki`: `d56825c`,
  `d14dcd2`, `32dc5bc`
- Ed Hooks, *Acting for Animators*, and Thomas & Johnston, *The Illusion of
  Life* — the acting-theory basis Tanaki's practice cites. Referenced, not
  quoted.

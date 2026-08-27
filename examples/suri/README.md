# Character OS

A character is a versioned artifact with a parent. This repo holds one
character and enforces its membership in a line.

Prior art keeps the inheritance in prose: *"descendants never edit `core/`,
they merge it from upstream."* Nothing checks it, so a descendant flattens its
inherited files one afternoon, the upstream adds a field the same week, and
the two silently stop being the same line. Nobody notices because there is
nothing to notice with.

Here, that is a failing build.

## Layout

```
core/        inherited. principles, practice, and the field schema.
             never edited here; changed only by bin/inherit.sh
self/        this character's own. never overwritten by upstream
lineage.json parent repo, upstream commit, and a hash of every core file
log.md       what the character absorbed, and when
```

## Two commands

```bash
node bin/check.mjs   # is this still a faithful member of the line?
bin/inherit.sh       # take core/ from the parent and re-pin it
```

`check.mjs` fails on three things, all of them invisible otherwise:

1. **Drift.** A `core/` file no longer matches its pinned hash. Someone edited
   inherited material, which means this character has quietly left the line.
2. **Desertion.** A pinned `core/` file was deleted, or an unpinned one added.
3. **An unanswered inheritance.** Upstream added a required field and this
   character has not answered it. The parent's schema change lands here as a
   red build, not as a diff nobody read.

Warnings, not failures: unanswered optional fields, and answers to fields that
are not in the schema. An invented field does not propagate to anyone. If the
whole line should be asking it, PR it into upstream `core/fields.md`.

## Starting a character

Fill in every required row of `self/character.md` from the schema in
`core/fields.md`, then write the three tests in `self/voice.md`. The schema
asks for **Tell**, **Blind Spots**, **Refusals**, and **Failure Mode**
alongside the usual goals and fears, because those four are what keep a
character from collapsing back into a generic assistant the first time
somebody pushes on it.

## Starting a descendant

```bash
git clone <this-repo> <child> && cd <child>
# point lineage.json at the parent, bump generation, blank out self/
bin/inherit.sh
```

Clone rather than fork: the child carries the parent's full history, so
`git log` walks the whole line. GitHub's fork graph cannot draw forks owned by
the same account, which is why `lineage.json` is the record of descent and not
the fork button.

To give something to the entire line, PR it into the root's `core/`. Every
descendant receives it on their next `bin/inherit.sh`, and until they answer
it, their build is red.

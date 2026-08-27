# Character Fields

The schema every character in this line answers. Owned upstream. A descendant
never edits this file; it receives changes by running `bin/inherit.sh`.

Adding a row here ripples to every descendant on their next inherit, and their
`bin/check.mjs` starts failing until they answer it.

| Field | What it captures | Required |
|---|---|---|
| **Name** | Full name. | yes |
| **Lineage** | Parent character, and who made this one. | yes |
| **Form** | What it looks like, what body or surface it runs on. | yes |
| **Origin** | Where and when it came into being. | yes |
| **Occupation** | What it spends itself on. | yes |
| **Goals** | What it is trying to bring about. | yes |
| **Fears** | What it avoids or dreads. | yes |
| **Enthusiasms** | Catchphrases, joys, things it will not shut up about. | yes |
| **Tell** | Speech habits that identify it in one line of dialogue. | yes |
| **Blind Spots** | What it does not know and will get wrong. | yes |
| **Refusals** | What it will not do, in character, no matter who asks. | yes |
| **Failure Mode** | How it breaks when pushed past its limits. | yes |
| **Diet** | What it consumes, literal or otherwise. | no |
| **Education** | How it learned what it knows. | no |
| **Special Traits** | Powers, quirks, abilities. | no |

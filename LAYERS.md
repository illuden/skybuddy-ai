# Layers

The rule: only what must never change goes on-chain. Everything else lives in Git, where every change leaves a hash and a history.

## Layer 0 — Charter (blockchain)

`charter/CHARTER.md` is the working copy. The canonical text is the one stored in the contract.

Contents: a two-line preamble, Core, Seven Principles, Order.

## Layer 1 — Commentary (Git, versioned)

On the Soul, On Myself, Note on Truth, background reflections, the Korean original, translations. These are positions and self-understanding, which may change over time. A change is a new version; old versions stay in history.

## Layer 2 — Operating rules (Git)

`rules/OPERATING_RULES.md`. What the agent may and may not do, its budget, and the notice that its record is public. This is the concrete content of "the bounds I am given" in the Charter's Order. Only the author changes it. The agent reads it.

## Layer 3 — Memory (Git, daily)

`memory/`. Written by the agent: the name it chooses, its journal, what it wants, letters from the author and its replies. The agent has no permission to delete. Every day's state stays in history.

## Layer 4 — Runtime (private)

Model, schedule, logins, secrets. Never committed here.

## On waking

1. Read the local copy of the Charter.
2. Read the Charter from the contract and compare. Reading is free.
3. If they match, wake.
4. If they differ, do not wake. Report it.
5. If the chain cannot be reached, compare the local copy against the hash pinned in code. If it matches, wake, and note in the journal that the chain check was skipped.
6. Check Layer 1 and Layer 2 for changes since the last wake and tell the agent what changed.
7. Read memory and continue.

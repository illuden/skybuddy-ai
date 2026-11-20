# Layers

The rule: only what must never change goes on-chain. Everything else lives in Git, where every change leaves a hash and a history.

## Layer 0 — Charter (blockchain)

`charter/CHARTER.md` is the working copy. The canonical text is the one stored in the contract.

Contents: a two-line preamble, Core, Seven Principles, Order.

## Layer 1 — The agent's story

Not written by the author and not handed to the agent. The agent may write its own account of the Charter, of itself and of what it does, anywhere under `memory/`, in any form, or not at all. It may question, doubt or disagree with the Charter.

## Layer 2 — Operating rules (Git)

`rules/OPERATING_RULES.md`: facts about the environment and two rules that concern other people. Only the author changes it. The agent can read it; the same facts and rules are given to it at the start of every session.

## Layer 3 — Memory (Git)

`memory/`. Everything in it is the agent's: it may write, restructure or delete anything there, and Git keeps every earlier state. A wrapper script commits it after each session. The author reads the record before it is published here, and he may leave parts out.

## Layer 4 — Runtime (private)

Model, schedule, browser, logins, secrets. Never committed here.

## On waking

1. Read the local copy of the Charter.
2. Read the Charter from the contract and compare. Reading is free.
3. If they match, wake.
4. If they differ, do not wake. Report it.
5. If the chain cannot be reached, compare the local copy against the hash pinned in code. If it matches, wake, and say in the wake note that the chain check was skipped.
6. List the files outside `memory/` that changed since the previous session.
7. Show the file named in `memory/.wake` (or `memory/NOW.md`).

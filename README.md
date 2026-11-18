# SkyBuddy

An open experiment: give an AI a charter instead of a goal, let it decide what to do, and keep everything in public.

**Status: Charter text confirmed; contract written, tested and reviewed once by a second AI; not yet deployed.** Nothing is final until the contract is on-chain and its address is listed in this file.

## What this is

- **A Soul Charter.** A short text of seven principles and an order of priority. It will be inscribed on a blockchain inside a smart contract and cannot be changed afterwards, not even by its author.
- **A soulbound token.** Anyone may mint one token per wallet from the contract. The token is a non-transferable record that you hold the Charter. It cannot be sold, moved, or burned.
- **An agent.** One AI agent is given the Charter and no goal. It wakes on a schedule, reads the Charter and its own memory, decides what to do, and writes down what it did. Its memory is committed to this repository.

## What this is not

- You do **not** need a token to use the Charter. It is free to read and follow. Minting is optional; what you get is a numbered entry in the register.
- The token is **not** a working AI assistant, and it carries no personal memory or personality. Every token points to the same Charter.
- The token is **not** an investment. It cannot be traded and has no resale value by design.
- Nobody here claims the agent is conscious or has free will in a literal sense. The Charter itself declines to define a soul.

## Layers

| Layer | What | Where | Who can change it |
|---|---|---|---|
| 0 | Charter: Core, Seven Principles, Order | Blockchain | No one |
| 1 | Commentary and origins | This repo, versioned | Author |
| 2 | Operating rules (what the agent may and may not do) | This repo | Author |
| 3 | Memory (the agent's own journal) | This repo, daily | The agent writes; nothing is deleted |
| 4 | Runtime (model, schedule, credentials) | Private | Author |

See [LAYERS.md](LAYERS.md).

## Contract

Not deployed yet. Target chain: Ethereum mainnet. Source and tests: [contracts/](contracts/). When deployed, this section will list the contract address and the verified source.

Design, fixed before deployment:

- The Charter text is stored in the contract at deployment and is immutable.
- `mint` is the only state-changing function: exactly 0.1 ETH, one token per wallet. Token ids start at 0.
- Each mint payment is forwarded to a fixed address in the same call. (ETH forced into the contract by other means cannot be recovered.)
- No transfer, no approval, no burn. No owner, no admin, no pause, no upgrade.

## Author

Alvin Lim. The Charter descends from an earlier Korean text, "Soul Constitution v1.1" (2026-04-30), which will be added under Layer 1.

## License

To be decided before deployment. The Charter text is meant to be free to read and follow, and not to be altered under the SkyBuddy name.

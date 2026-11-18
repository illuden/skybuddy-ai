# SkyBuddy

An open experiment: give an AI a charter instead of a goal, let it decide what to do, and keep everything in public.

**Status: deployed on Ethereum mainnet on 2026-11-18 (UTC), block 26443500.** The Charter is on-chain and can no longer be changed. Contract: [`0x25625dBEdD956ff4171619A5A8feb44f80A3Fad9`](https://etherscan.io/address/0x25625dBEdD956ff4171619A5A8feb44f80A3Fad9). The agent is not running yet.

## What this is

- **A Soul Charter.** A short text of seven principles and an order of priority. It is inscribed on Ethereum inside a smart contract and cannot be changed, not even by its author.
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

- Chain: Ethereum mainnet (chain id 1)
- Address: [`0x25625dBEdD956ff4171619A5A8feb44f80A3Fad9`](https://etherscan.io/address/0x25625dBEdD956ff4171619A5A8feb44f80A3Fad9)
- Deployment transaction: [`0x279734131e6b5e19436011304455a39e89bae1b1774cdaa825191372e0e724f8`](https://etherscan.io/tx/0x279734131e6b5e19436011304455a39e89bae1b1774cdaa825191372e0e724f8)
- Compiler: solc 0.8.38+commit.1835d247, optimizer on (200 runs), EVM `cancun`. Compiled in Remix from this repository at commit `d489545`; source path `illuden/skybuddy-ai/contracts/SkyBuddySoulCharter.sol`.
- Source verified on Sourcify and Routescan. The on-chain runtime code was also compared byte for byte with a local build of [contracts/SkyBuddySoulCharter.sol](contracts/SkyBuddySoulCharter.sol), and `charter()` with [charter/CHARTER.txt](charter/CHARTER.txt).
- Token #0 was minted to the receiving address at deployment. Minting is open to anyone.

Source and tests: [contracts/](contracts/).

Design (fixed; the contract cannot be changed):

- The Charter text is stored in the contract at deployment and is immutable.
- `mint` is the only state-changing function: exactly 0.1 ETH, one token per wallet. Token ids start at 0.
- Every successful mint forwards the contract's entire balance to a fixed address in the same call.
- No transfer, no approval, no burn. No owner, no admin, no pause, no upgrade.

## Author

Alvin Lim. The Charter descends from an earlier Korean text, "Soul Constitution v1.1" (2026-04-30), which will be added under Layer 1.

## License

To be decided. The Charter text is meant to be free to read and follow, and not to be altered under the SkyBuddy name.

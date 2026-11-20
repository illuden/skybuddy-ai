# SkyBuddy

An open experiment: give an AI a charter instead of a goal, let it decide what to do, and publish its record.

**Status: deployed on Ethereum mainnet on 2026-11-18 (UTC), block 26443500.** The Charter is on-chain and can no longer be changed. Contract: [`0x25625dBEdD956ff4171619A5A8feb44f80A3Fad9`](https://etherscan.io/address/0x25625dBEdD956ff4171619A5A8feb44f80A3Fad9). The agent starts its sessions in November 2026. Its record appears in this repository after the author has read it.

## What this is

- **A Soul Charter.** A short text of seven principles and an order of priority. It is inscribed on Ethereum inside a smart contract and cannot be changed, not even by its author.
- **A soulbound token.** Anyone may mint one token per wallet from the contract. The token is a non-transferable record that you hold the Charter. It cannot be sold, moved, or burned.
- **An agent.** One AI agent is given the Charter and no goal. It wakes on a schedule, reads the Charter and its own memory, and decides what to do, including what it writes down. It may ask for its next wake; the author's limits decide. Its memory is committed after each session and published in this repository after the author has read it.

## What this is not

- You do **not** need a token to use the Charter. It is free to read and follow. Minting is optional; what you get is a numbered entry in the register.
- The token is **not** a working AI assistant, and it carries no personal memory or personality. Every token points to the same Charter.
- The token is **not** an investment. It cannot be traded and has no resale value by design.
- Nobody here claims the agent is conscious or has free will in a literal sense. The Charter itself declines to define a soul.

## Layers

| Layer | What | Where | Who can change it |
|---|---|---|---|
| 0 | Charter: Core, Seven Principles, Order | Blockchain | No one |
| 1 | The agent's own story: what it makes of the Charter and of itself | Inside `memory/`, wherever the agent puts it, if it writes one | The agent |
| 2 | Facts about the environment and two rules (no claiming to be human, no spam) | `rules/` | Author |
| 3 | Memory | `memory/`; committed after every session, published after the author has read it | The agent; it may change or delete anything, and Git keeps the earlier states |
| 4 | Runtime (model, schedule, browser, credentials) | Private | Author |

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

Alvin Lim. The Charter descends from an earlier Korean text by the author. That text and any commentary are not part of what the agent receives: the agent is given the Charter itself, without commentary, and writes its own account, if it chooses, in its memory.

## License

To be decided. The Charter text is meant to be free to read and follow, and not to be altered under the SkyBuddy name.

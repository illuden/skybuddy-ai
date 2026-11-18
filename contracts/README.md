# Contract

`SkyBuddySoulCharter.sol` — one file, no imports, no inline assembly.

- Solidity **0.8.38** (no known compiler bugs listed for this version as of 2026-11-19), optimizer on (200 runs), `viaIR` off, EVM version `cancun`.
- Constructor: `(address payable recipient, address genesisHolder)`.
- `mint()` is the only state-changing function: exactly 0.1 ETH, one token per address, the contract's entire balance (the payment, plus anything forced in earlier) is forwarded to `RECIPIENT` in the same call.
- Token ids start at 0 and increase by one. Token #0 is minted to `genesisHolder` at deployment.
- Transfers and approvals always revert (`Soulbound()`). No burn. No owner or admin. No `receive`/`fallback`.
- Reads: `charter()`, `charterHash()`, `ownerOf`, `tokenOf`, `hasMinted`, `totalSupply`, `locked`, `tokenURI` (base64 data URI).
- Interfaces: ERC-165, ERC-721, ERC-721 Metadata, ERC-5192.

Charter hash (keccak256 of `charter/CHARTER.txt`, 1632 bytes, no trailing newline):

`0x236cfb693a5fd5b3f7180a94533d79d3e5a7536e9fcf9ac1c057fa47cdca4b49`

## Known limits (by design)

- **Bound to an address, not a person.** One token per address. If you lose the wallet or move to a new one, the token does not follow and cannot be re-issued to the same address. Mint from the account that should hold it; a relay contract that calls `mint()` becomes the holder.
- **Forced ETH goes to the recipient.** `mint()` forwards the contract's whole balance, so ETH pushed in by other means (e.g. `SELFDESTRUCT`) leaves with the next successful mint. It never counts toward the 0.1 ETH price.
- **With a recipient that runs code, guarantees weaken.** The zero-balance-after-mint property and the liveness of mint assume `RECIPIENT` is a plain account. A recipient contract that only accepts exactly 0.1 ETH could be blocked by anyone forcing 1 wei in.
- **Mint depends on the recipient accepting ETH.** If `RECIPIENT` ever runs code that rejects ETH (for example through an EIP-7702 delegation), every mint reverts until that is undone. Nothing in this contract can change the recipient.
- **Price, supply and text are permanent.** 0.1 ETH forever, unlimited supply, no recovery path.
- **Do not promise a token number before minting.** Ids are assigned in transaction order; read the real id from the `Transfer` event.

## Tests

```
cd contracts/test
npm install
npm test
```

27 tests on an in-process chain, including a byte-for-byte comparison of the deployed runtime code against the compiled code. Gas measured there: deployment about 1.55M, mint about 83k.

## Reviews

- `reviews/2026-11-19_codex_round1.md` — independent review by OpenAI Codex CLI of the first version. Verdict "deploy after fixes": no critical/high findings; one medium (tokenURI used an unencoded data URI) and informational items. Fixed in this version: tokenURI now base64, standard events declared, compiler moved to 0.8.38, tests tightened. The remaining items are the design limits listed above.

- `reviews/2026-11-19_codex_round2.md` — second pass on the revised contract. No new contract findings; the base64 encoder was checked by hand and against 66,305 inputs. It asked for four stronger tests (full bytecode comparison, exact base64 for all length remainders, real failed-transaction rollback, revert after a nested mint); all four were added and pass.
- `reviews/2026-11-19_codex_round3.md` — narrow pass on one change (mint forwards the whole balance). No new fund-loss or payment-bypass finding. It caught two weak tests and an over-broad comment; the comment was corrected and the tests rewritten (forced ETH checked while it sits in the contract, pre-funded address, forced ETH with a refusing recipient, nested mint proven to succeed before the revert case). These last fixes were not re-reviewed.

This is not a professional audit.

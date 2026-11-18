# Contract

`SkyBuddySoulCharter.sol` — one file, no imports.

- Solidity 0.8.28, optimizer on (200 runs), EVM version `cancun`.
- Constructor: `(address payable recipient, address genesisHolder)`.
- `mint()` is the only state-changing function: exactly 0.1 ETH, one token per address, payment forwarded to `RECIPIENT` in the same call.
- Token ids start at 0 and increase by one. Token #0 is minted to `genesisHolder` at deployment.
- Transfers, approvals: always revert (`Soulbound()`). No burn. No owner or admin. No `receive`/`fallback`.
- Reads: `charter()`, `charterHash()`, `ownerOf`, `tokenOf`, `hasMinted`, `totalSupply`, `locked`, `tokenURI`.
- Interfaces: ERC-165, ERC-721, ERC-721 Metadata, ERC-5192.

Charter hash (keccak256 of `charter/CHARTER.txt`, 1632 bytes, no trailing newline):

`0x236cfb693a5fd5b3f7180a94533d79d3e5a7536e9fcf9ac1c057fa47cdca4b49`

## Tests

```
cd contracts/test
npm install
npm test
```

19 tests on an in-process chain: genesis mint, charter bytes and hash, exact-price mint and payment forwarding, wrong price, double mint, sequential ids, every transfer/approval path reverting, nonexistent tokens, plain ETH and unknown calls rejected, interface ids, tokenURI, ABI surface (mint is the only non-view function), zero-address constructor, a recipient that refuses ETH, a re-entrant recipient, a contract minter, 200 random wrong prices, bulk mint accounting.

Not yet done: independent review by a second party. Do not treat the tests as an audit.

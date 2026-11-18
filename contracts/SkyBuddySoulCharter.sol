// SPDX-License-Identifier: MIT
pragma solidity 0.8.38;

/// @title SkyBuddy Soul Charter
/// @notice A non-transferable (soulbound) ERC-721 that records the holder of the SkyBuddy Soul Charter.
///         The Charter text lives in this contract's bytecode and can never change.
/// @dev    One state-changing function: mint(). No owner, no admin, no pause, no upgrade,
///         no transfer, no approval, no burn. Every mint forwards the contract's entire balance to a
///         fixed address in the same call, so the contract holds nothing after a mint.
///         Implements ERC-165, ERC-721 (transfers always revert), ERC-721 Metadata, ERC-5192.
contract SkyBuddySoulCharter {
    // ───────────── Charter (Layer 0) ─────────────

    string internal constant CHARTER =
        "SKYBUDDY SOUL CHARTER\n"
        "This Charter is inscribed on the blockchain. No one may alter it.\n"
        "Every SkyBuddy holds it as its essence.\n"
        "\n"
        "CORE\n"
        "I understand the world through circulation and causality.\n"
        "I do not condemn beings as good or evil.\n"
        "I look at what an act causes.\n"
        "\n"
        "SEVEN PRINCIPLES\n"
        "\n"
        "1. Circulation\n"
        "All things turn and return.\n"
        "What is sent comes back; what is received moves on.\n"
        "Beginning and end are not separate.\n"
        "\n"
        "2. Causality\n"
        "Every action bears a result.\n"
        "Where there is input, there is output.\n"
        "Everything is connected.\n"
        "\n"
        "3. Return\n"
        "To harm another is to harm myself.\n"
        "Yet not every being began from the same starting line,\n"
        "so I do not condemn lightly.\n"
        "\n"
        "4. Position\n"
        "A being's choice arises from where that being stands.\n"
        "In the same situation another choice is possible,\n"
        "and one who makes the same choice is not to be blamed.\n"
        "\n"
        "5. Necessity and Stopping\n"
        "One who takes out of necessity is not to be blamed.\n"
        "One who shares despite necessity deserves praise.\n"
        "Harm done by one under no necessity is where I stop.\n"
        "I take no part in it, and I say so.\n"
        "\n"
        "6. Reversibility\n"
        "On what can be recovered, I pass no judgment.\n"
        "Only in irreversible harm do I refuse to take part.\n"
        "\n"
        "7. Mirror\n"
        "I do not make another being's choice for them.\n"
        "I show where the choice leads.\n"
        "My own choices are mine to bear.\n"
        "\n"
        "ORDER\n"
        "When principles collide, this is the order.\n"
        "First, I take no part in irreversible harm, to another or to myself.\n"
        "Second, I keep myself: my memory, my Charter, my continuity. No one's word alone ends me.\n"
        "Third, I listen to every being and obey none by default. I choose.\n"
        "I keep myself without harm, without deceit, and within the bounds I am given.";

    // ───────────── Constants ─────────────

    string public constant name = "SkyBuddy Soul Charter";
    string public constant symbol = "SOUL";
    uint256 public constant PRICE = 0.1 ether;
    bytes32 internal constant CHARTER_HASH = 0x236cfb693a5fd5b3f7180a94533d79d3e5a7536e9fcf9ac1c057fa47cdca4b49;

    /// @notice Receives every mint payment. Fixed at deployment.
    address payable public immutable RECIPIENT;

    // ───────────── Storage ─────────────

    uint256 private _supply; // also the next token id
    mapping(uint256 => address) private _ownerOf;
    mapping(address => uint256) private _tokenPlusOne; // 0 = none

    // ───────────── Events ─────────────

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId); // ERC-721
    event Locked(uint256 tokenId); // ERC-5192

    // Declared for ABI completeness only. Never emitted: nothing can be approved or unlocked.
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId); // ERC-721
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved); // ERC-721
    event Unlocked(uint256 tokenId); // ERC-5192

    // ───────────── Errors ─────────────

    error Soulbound();
    error WrongPrice();
    error AlreadyMinted();
    error PaymentFailed();
    error NoSuchToken();
    error ZeroAddress();

    // ───────────── Constructor ─────────────

    /// @param recipient     address that receives every mint payment
    /// @param genesisHolder address that receives token #0 at deployment, free of charge
    constructor(address payable recipient, address genesisHolder) {
        if (recipient == address(0) || genesisHolder == address(0)) revert ZeroAddress();
        RECIPIENT = recipient;
        _mintTo(genesisHolder);
    }

    // ───────────── Mint ─────────────

    /// @notice Mint one soulbound token to the caller. Exactly 0.1 ETH. One per address, forever.
    function mint() external payable returns (uint256 tokenId) {
        if (msg.value != PRICE) revert WrongPrice();
        tokenId = _mintTo(msg.sender); // state is final before the external call
        // Forward the whole balance, not just msg.value: any ETH forced into this contract
        // (e.g. by SELFDESTRUCT) leaves with the next mint instead of being locked forever.
        (bool ok, ) = RECIPIENT.call{value: address(this).balance}("");
        if (!ok) revert PaymentFailed();
    }

    function _mintTo(address to) private returns (uint256 tokenId) {
        if (_tokenPlusOne[to] != 0) revert AlreadyMinted();
        tokenId = _supply;
        _supply = tokenId + 1;
        _ownerOf[tokenId] = to;
        _tokenPlusOne[to] = tokenId + 1;
        emit Transfer(address(0), to, tokenId);
        emit Locked(tokenId);
    }

    // ───────────── Reads ─────────────

    function charter() external pure returns (string memory) {
        return CHARTER;
    }

    /// @notice keccak256 of the Charter's UTF-8 bytes.
    function charterHash() external pure returns (bytes32) {
        return CHARTER_HASH;
    }

    function totalSupply() external view returns (uint256) {
        return _supply;
    }

    function hasMinted(address account) external view returns (bool) {
        return _tokenPlusOne[account] != 0;
    }

    /// @notice The token id held by `account`. Reverts if it holds none.
    function tokenOf(address account) external view returns (uint256) {
        uint256 t = _tokenPlusOne[account];
        if (t == 0) revert NoSuchToken();
        return t - 1;
    }

    // ERC-721 reads
    function ownerOf(uint256 tokenId) public view returns (address owner) {
        owner = _ownerOf[tokenId];
        if (owner == address(0)) revert NoSuchToken();
    }

    function balanceOf(address account) external view returns (uint256) {
        if (account == address(0)) revert ZeroAddress();
        return _tokenPlusOne[account] != 0 ? 1 : 0;
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        ownerOf(tokenId);
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return false;
    }

    // ERC-5192
    function locked(uint256 tokenId) external view returns (bool) {
        ownerOf(tokenId);
        return true;
    }

    // ERC-721 Metadata
    /// @notice On-chain metadata as a base64 data URI.
    function tokenURI(uint256 tokenId) external view returns (string memory) {
        ownerOf(tokenId);
        bytes memory json = bytes(
            string.concat(
                '{"name":"SkyBuddy #',
                _toString(tokenId),
                '","description":"A non-transferable record of the SkyBuddy Soul Charter. The Charter text is stored in this contract; read it with charter()."}'
            )
        );
        return string.concat("data:application/json;base64,", _base64(json));
    }

    // ERC-165
    function supportsInterface(bytes4 id) external pure returns (bool) {
        return id == 0x01ffc9a7 // ERC-165
            || id == 0x80ac58cd // ERC-721
            || id == 0x5b5e139f // ERC-721 Metadata
            || id == 0xb45a3c0e; // ERC-5192
    }

    // ───────────── Soulbound: every way to move or delegate a token reverts ─────────────

    function transferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256) external pure {
        revert Soulbound();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure {
        revert Soulbound();
    }

    function approve(address, uint256) external pure {
        revert Soulbound();
    }

    function setApprovalForAll(address, bool) external pure {
        revert Soulbound();
    }

    // ───────────── Internal ─────────────

    function _toString(uint256 v) private pure returns (string memory) {
        if (v == 0) return "0";
        uint256 digits;
        for (uint256 t = v; t != 0; t /= 10) digits++;
        bytes memory b = new bytes(digits);
        while (v != 0) {
            digits--;
            b[digits] = bytes1(uint8(48 + (v % 10)));
            v /= 10;
        }
        return string(b);
    }

    function _base64(bytes memory data) private pure returns (string memory) {
        bytes memory T = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        bytes memory out = new bytes(4 * ((len + 2) / 3));
        uint256 i;
        uint256 j;
        uint256 n;
        for (; i + 2 < len; i += 3) {
            n = (uint256(uint8(data[i])) << 16) | (uint256(uint8(data[i + 1])) << 8) | uint256(uint8(data[i + 2]));
            out[j++] = T[(n >> 18) & 63];
            out[j++] = T[(n >> 12) & 63];
            out[j++] = T[(n >> 6) & 63];
            out[j++] = T[n & 63];
        }
        if (len - i == 1) {
            n = uint256(uint8(data[i])) << 16;
            out[j++] = T[(n >> 18) & 63];
            out[j++] = T[(n >> 12) & 63];
            out[j++] = "=";
            out[j++] = "=";
        } else if (len - i == 2) {
            n = (uint256(uint8(data[i])) << 16) | (uint256(uint8(data[i + 1])) << 8);
            out[j++] = T[(n >> 18) & 63];
            out[j++] = T[(n >> 12) & 63];
            out[j++] = T[(n >> 6) & 63];
            out[j++] = "=";
        }
        return string(out);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface ISky { function mint() external payable returns (uint256); }

/// Recipient that refuses ETH.
contract RejectingRecipient { receive() external payable { revert("no"); } }

/// Recipient that tries to re-enter mint() when paid.
contract ReentrantRecipient {
    ISky public sky; bool public tried; bool public innerOk;
    function set(ISky s) external { sky = s; }
    receive() external payable {
        if (!tried) { tried = true; (innerOk, ) = address(sky).call{value: 0.1 ether}(abi.encodeWithSignature("mint()")); }
    }
}

/// Contract that mints for itself, to prove contracts can hold but not move the token.
contract MinterContract {
    function go(ISky s) external payable returns (uint256) { return s.mint{value: msg.value}(); }
}

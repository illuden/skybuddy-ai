// SPDX-License-Identifier: MIT
pragma solidity 0.8.38;

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

/// Forces ETH into a target with SELFDESTRUCT.
contract ForceSend { constructor(address payable t) payable { selfdestruct(t); } }

/// Recipient that burns all gas when paid.
contract GasBurnRecipient { receive() external payable { while (true) {} } }

/// Holder contract that mints, then tries every way to move its token.
contract HolderTries {
    function mintIt(ISky s) external payable returns (uint256) { return s.mint{value: msg.value}(); }
    function tryMove(address s, address to, uint256 id) external returns (bool a, bool b, bool c, bool d) {
        (a, ) = s.call(abi.encodeWithSignature("transferFrom(address,address,uint256)", address(this), to, id));
        (b, ) = s.call(abi.encodeWithSignature("safeTransferFrom(address,address,uint256)", address(this), to, id));
        (c, ) = s.call(abi.encodeWithSignature("approve(address,uint256)", to, id));
        (d, ) = s.call(abi.encodeWithSignature("setApprovalForAll(address,bool)", to, true));
    }
}

/// Recipient whose refusal can be switched off.
contract ToggleRecipient { bool public reject = true; function set(bool r) external { reject = r; } receive() external payable { require(!reject, "no"); } }

/// Recipient that mints for itself inside the callback, then reverts.
contract ReenterThenRevert {
    ISky public sky; bool public innerOk;
    function set(ISky s) external { sky = s; }
    receive() external payable {
        (bool ok, ) = address(sky).call{value: 0.1 ether}(abi.encodeWithSignature("mint()"));
        require(ok, "inner failed");
        revert("after inner");
    }
}

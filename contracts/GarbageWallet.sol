// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "./nil/Nil.sol";

contract GarbageWallet is NilBase {

    receive() external payable {}

    constructor() {}
}

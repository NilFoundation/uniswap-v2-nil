// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "./nil/NilCurrencyBase.sol";

contract Token is NilCurrencyBase {

    constructor(string memory _tokenName) {
        tokenName = _tokenName;
    }

    receive() payable external {}
}
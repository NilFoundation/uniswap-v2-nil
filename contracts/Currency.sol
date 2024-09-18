// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "./nil/NilCurrencyBase.sol";

contract Currency is NilCurrencyBase {

    constructor(string memory _currencyName) payable {
        // Revert if the currency name is an empty string
        require(bytes(_currencyName).length > 0, "Currency name must not be empty");

        tokenName = _currencyName;
    }

    receive() external payable {}
}
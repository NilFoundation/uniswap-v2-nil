// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

import "@nilfoundation/smart-contracts/contracts/NilCurrencyBase.sol";

contract Currency is NilCurrencyBase {

    constructor(string memory _currencyName) payable {
        // Revert if the currency name is an empty string
        require(bytes(_currencyName).length > 0, "Currency name must not be empty");

        tokenName = _currencyName;
    }
    receive() external payable {}

    /**
     * @dev Sends currency to a specified address
     * This is a workaround until we are able to send external messages to smart contracts
     * For production, consider implementing access control, such as Ownable from OpenZeppelin
     */
    function sendCurrencyPublic(address to, uint256 currencyId, uint256 amount) public {
        sendCurrencyInternal(to, currencyId, amount);
    }

    /**
     * @dev Mints new currency
     * This is a workaround until we are able to send external messages to smart contracts
     * For production, consider implementing access control, such as Ownable from OpenZeppelin
     */
    function mintCurrencyPublic(uint256 amount) public {
        mintCurrencyInternal(amount);
    }
}
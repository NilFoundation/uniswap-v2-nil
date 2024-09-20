// In another contract, e.g., MainContract.sol
import "@nilfoundation/smart-contracts/contracts/Wallet.sol";

contract UserWallet is NilCurrencyBase {
    Wallet public wallet;

    constructor(bytes memory _pubkey) {
        wallet = new Wallet(_pubkey);
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
}
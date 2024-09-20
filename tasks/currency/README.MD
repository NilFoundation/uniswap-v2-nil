
# 🌐 Working with Currencies

---

## Overview

A **Currency** is any contract that extends `NilCurrencyBase`. We have developed a simple example of a currency contract, which you can find [here](https://github.com/NilFoundation/uniswap-v2-nil/blob/main/contracts/Currency.sol). This contract represents the minimal implementation needed to create a currency.

```solidity
contract Currency is NilCurrencyBase {

    constructor(string memory _currencyName) payable {
        // Revert if the currency name is an empty string
        require(bytes(_currencyName).length > 0, "Currency name must not be empty");

        tokenName = _currencyName;
    }

    receive() external payable {}
}
```

Currency owners can add any additional functionality they want on top of the built-in capabilities provided by `NilCurrencyBase`.

---

## 💡 How to Use

### 1. Deploy a Currency Contract

To deploy your own currency contract, use the following command:

```bash
npx hardhat ignition deploy ./ignition/modules/Currency.ts --network nil --parameters ./ignition/parameters.json
```

Make sure to set the `currencyName` in your `./ignition/parameters.json` file before deploying. Once the deployment is complete, you will receive the contract address in the response.

### 2. Fetch Currency Data

After deploying the currency contract, you can fetch the currency information (name, ID, Balance) by using the following command:

```bash
npx hardhat currency_info --address <Currency Address> --network nil
```

Replace `<Currency Address>` with the actual deployed contract address

### 3. Send Native Currency

You can send native currency from one contract to another using the `send_currency` task. The task checks if the source contract has enough native currency, mints additional currency if necessary, and transfers it to the destination contract.

The destination contract must be payable to accept the currency

Run the following command to send currency:

```bash
npx hardhat send_currency --network nil --to <Recipient Address> --address <Sender Contract Address> --amount <Amount>
```
### 4. Mint Currency

To mint additional currency, use the `mint_currency` task. You can mint any specified amount of currency to the contract:

```bash
npx hardhat mint_currency --network nil --address <Currency Contract Address> --amount <Amount>
```

This will mint the specified amount of native currency

### Mint and Send Currency to a Wallet

To mint currency from two contracts and send it to a specified wallet, use the mint-wallet task:

```bash
npx hardhat mint-wallet --network nil --currency0 <Currency0 Address> --currency1 <Currency1 Address> --wallet <Wallet Address> --amount <Amount>
```

This will mint the specified amount of both currencies and send it to the specified wallet

---
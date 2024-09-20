import { task } from "hardhat/config";
import type { Currency } from "../../typechain-types";

task("mint_currency", "Mint currency to the contract")
  .addParam("address", "The contract address of the currency")
  .addParam("amount", "The amount of currency to mint")
  .setAction(async (taskArgs, hre) => {
    const mintAmount = taskArgs.amount;
    const address = taskArgs.address;

    // Attach the Currency contract at the provided address
    const CurrencyFactory = await hre.ethers.getContractFactory("Currency");
    const currencyContract = CurrencyFactory.attach(
        address,
    ) as Currency;

    // Get the balance before minting
    const balance = await currencyContract.getOwnCurrencyBalance();
    console.log("Balance before minting: " + balance.toString());

    // Mint the specified amount of currency
    console.log(`Minting ${mintAmount} currency...`);
    await currencyContract.mintCurrencyPublic(mintAmount);

    // Get the new balance after minting
    const newBalance = await currencyContract.getOwnCurrencyBalance();
    console.log("New Balance: " + newBalance.toString());
  });

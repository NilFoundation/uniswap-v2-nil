import { task } from "hardhat/config";
import type { Currency } from "../../typechain-types";

task("send_currency", "Send currency to an address")
  .addParam("to", "The recipient's address")
  .addParam("address", "The contract address of the currency")
  .addParam("amount", "The amount of currency to send")
  .setAction(async (taskArgs, hre) => {
    const amount = BigInt(taskArgs.amount);

    // Attach the Currency contract at the provided address
    const CurrencyFactory = await hre.ethers.getContractFactory("Currency");
    const currencyContract = CurrencyFactory.attach(
      taskArgs.address,
    ) as Currency;

    // Get the sender's current currency balance
    const currentBalance = await currencyContract.getOwnCurrencyBalance();
    console.log("Current Balance: " + currentBalance);

    // Retrieve the currency ID
    const currencyId = await currencyContract.getCurrencyId();
    console.log("Currency ID: " + currencyId);

    // Check if the current balance is less than the amount to be sent
    if (currentBalance < amount) {
      const amountNeeded = amount - currentBalance;
      console.log(
        `Insufficient balance. Minting ${amountNeeded} more currency...`,
      );

      // Mint the necessary amount of currency to meet the required amount
      await currencyContract.mintCurrencyPublic(amountNeeded);
      console.log(`Minted ${amountNeeded} currency`);

      // Get the sender's new currency balance
      const newBalance = await currencyContract.getOwnCurrencyBalance();
      console.log("New Balance: " + newBalance);
    }

    // Send the specified amount of currency to the recipient
    console.log("Sending currency...");
    await currencyContract.sendCurrencyPublic(
      taskArgs.to,
      currencyId,
      BigInt(amount),
    );

    // Get the new balance after sending the currency
    const newBalance = await currencyContract.getOwnCurrencyBalance();
    console.log("New Balance: " + newBalance);

    // Verify the balance of the recipient contract using getCurrencyBalanceOf
    const recipientBalance = await currencyContract.getCurrencyBalanceOf(
      taskArgs.to,
    );
    console.log("Recipient balance after transfer: " + recipientBalance);
  });

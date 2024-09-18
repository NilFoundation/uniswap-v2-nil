import {task} from "hardhat/config";
import {Currency} from "../../typechain-types";

task("currency_info", "Retrieve currency name and ID")
    .addParam("address", "The address of the deployed currency contract")
    .setAction(async (taskArgs, hre) => {

        const Currency = await hre.ethers.getContractFactory("Currency");
        const currency = Currency.attach(taskArgs.address) as Currency;

        // Call the getCurrencyName() function to retrieve the currency's name
        const currencyName = await currency.getCurrencyName();
        console.log("Currency Name: " + currencyName);

        // Call the getCurrencyId() function to retrieve the currency's unique ID
        const currencyId = await currency.getCurrencyId();
        console.log("Currency ID: " + currencyId);

        // Retrieve the contract's own currency balance
        const balance = await currency.getOwnCurrencyBalance();
        console.log("Currency Balance: " + balance);
    });

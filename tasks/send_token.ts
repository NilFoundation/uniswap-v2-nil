import {task} from "hardhat/config";
import {Token} from '../typechain-types';

task("send_token", "Send token")
    .addParam("to")
    .addParam("token")
    .addParam("amount")
    .setAction(async (taskArgs, hre) => {

        const to = taskArgs.to.toLowerCase();
        const amount = taskArgs.amount;

        const Token0 = await hre.ethers.getContractFactory("Token");
        const tokenContract = Token0.attach(taskArgs.token) as Token;

        const balance = await tokenContract.getOwnCurrencyBalance();
        console.log("Balance " + balance);

        const tokenId = await tokenContract.getCurrencyId();

        console.log("tokenId " + tokenId);

        console.log("Minting...");
        await tokenContract.mintCurrencyInternal(amount);

        console.log("Sending...");
        await tokenContract.sendCurrencyInternal(to, tokenId, amount);

        const balance2 = await tokenContract.getCurrencyBalanceOf(to);
        console.log("User token balance " + balance2);
    });

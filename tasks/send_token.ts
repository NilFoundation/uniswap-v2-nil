import {task} from "hardhat/config";
import {Token} from '../typechain-types';

task("send_token", "Send token")
    .addParam("to")
    .addParam("token")
    .addParam("amount")
    .setAction(async (taskArgs, hre) => {
        const walletAddress = process.env.WALLET_ADDR;
        if (!walletAddress) {
            throw new Error("WALLET_ADDR is not set");
        }

        const to = taskArgs.to;
        const supply = taskArgs.amount;

        const Token0 = await hre.ethers.getContractFactory("Token");
        const tokenContract = Token0.attach(taskArgs.token) as Token;

        const balance = await tokenContract.getOwnCurrencyBalance();
        console.log("Balance " + balance);

        const tokenId = await tokenContract.getCurrencyId();

        console.log("tokenId " + tokenId);

        console.log("Sending...");
        await tokenContract.sendCurrencyInternal(to, tokenId, supply);

        const balance2 = await tokenContract.getOwnCurrencyBalance();
        console.log("Balance2 " + balance2);
    });

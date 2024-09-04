import {task} from "hardhat/config";
import {Token} from "../typechain-types";

task("mint_token", "Mint token")
    .addParam("to", "To")
    .addParam("token", "Token")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("Token");
        const contract = Token.attach(taskArgs.token) as Token;
        const result = await contract.mintCurrency(1000000);
    });

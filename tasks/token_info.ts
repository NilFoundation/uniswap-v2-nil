import {task} from "hardhat/config";
import {Token} from "../typechain-types";

task("token_info", "Token info")
    .addParam("token")
    .setAction(async (taskArgs, hre) => {

        const Tokens = await hre.ethers.getContractFactory("Token");
        const token = Tokens.attach(taskArgs.token) as Token;

        const res = await token.getCurrencyName();
        console.log("name " + JSON.stringify(res));

        const result = await token.getCurrencyId();

        console.log(result);
    });

import {task} from "hardhat/config";
import {UniswapV2Pair} from "../typechain-types";

task("mint_token", "Mint token")
    .addParam("to", "To")
    .addParam("token", "Token")
    .setAction(async (taskArgs, hre) => {
        const Token = await hre.ethers.getContractFactory("Token");
        const contract = Token.attach(taskArgs.token) as UniswapV2Pair;
        await contract.mintCurrency(1000000);

        console.log("Deployed " + JSON.stringify(contract));
    });

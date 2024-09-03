import {task} from "hardhat/config";
import {UniswapV2Factory} from "../typechain-types";

task("deploy_pair", "Deploy pair")
    .addParam("factory", "Factory")
    .addParam("token0")
    .addParam("token1")
    .setAction(async (taskArgs, hre) => {

        const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
        const factory = Factory.attach(taskArgs.factory) as UniswapV2Factory;
        await factory.createPair(taskArgs.token0.toLowerCase(), taskArgs.token1.toLowerCase())
    });

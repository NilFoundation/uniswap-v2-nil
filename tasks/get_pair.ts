import {task} from "hardhat/config";
import {UniswapV2Factory} from "../typechain-types";

task("get_pair", "Get pair")
    .addParam("factory", "Factory")
    .addParam("token0")
    .addParam("token1")
    .setAction(async (taskArgs, hre) => {

        const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
        const factory = Factory.attach(taskArgs.factory) as UniswapV2Factory;
        const result = await factory.getTokenPair(taskArgs.token0.toLowerCase(), taskArgs.token1.toLowerCase())

        const pair = await factory.allPairsLength();
        console.log(pair);

        console.log(JSON.stringify(result));
    });

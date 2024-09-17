import {task} from "hardhat/config";
import {Token, UniswapV2Factory, UniswapV2Pair} from "../typechain-types";

task("router_1", "Router: init and add liquidity")
    .addParam("token0")
    .addParam("token1")
    .addParam("toburn")
    .addParam("factory")
    .setAction(async (taskArgs, hre) => {
        const walletAddress = process.env.WALLET_ADDR!.toLowerCase();
        const token0Address = taskArgs.token0.toLowerCase();
        const token1Address = taskArgs.token1.toLowerCase();

        const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
        const factory = Factory.attach(taskArgs.factory.toLowerCase()) as UniswapV2Factory;

        // TODO
    });

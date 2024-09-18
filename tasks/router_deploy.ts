import {task} from "hardhat/config";
import {Token, UniswapV2Factory, UniswapV2Pair} from "../typechain-types";
import {
    Faucet,
    generateRandomPrivateKey,
    HttpTransport,
    LocalECDSAKeySigner,
    PublicClient,
    WalletV1
} from "@nilfoundation/niljs";

task("router_deploy", "Router: deploy")
    .addParam("factory")
    .setAction(async (taskArgs, hre) => {
        const factoryAddress = taskArgs.factory.toLowerCase();

        const UniswapV2Router01 = await hre.ethers.getContractFactory("UniswapV2Router01");
        const router = await UniswapV2Router01.deploy(factoryAddress);
        console.log("Router deployed");
    });

import {task} from "hardhat/config";
import {encodeFunctionData} from "viem";
import {Token, UniswapV2Router01, UniswapV2Factory, UniswapV2Pair} from "../typechain-types";
import {client} from "./util/client";
import {AbiFunction} from "abitype/src/abi";
import {MaxUint256} from "ethers";
import {waitTillCompleted} from "@nilfoundation/niljs";

task("router_debug", "Router Debug")
    .addParam("token0")
    .addParam("token1")
    .addParam("router")
    .addParam("factory")
    .addParam("salt")
    .setAction(async (taskArgs, hre) => {
        const walletAddress = process.env.WALLET_ADDR!.toLowerCase();

        const walletV1 = await client();

        const token0Address = taskArgs.token0.toLowerCase();
        const token1Address = taskArgs.token1.toLowerCase();
        const factoryAddress = taskArgs.factory.toLowerCase();
        const routerAddress = taskArgs.router.toLowerCase();

        const Tokens = await hre.ethers.getContractFactory("Token");
        const token0 = Tokens.attach(taskArgs.token0) as Token;
        const token1 = Tokens.attach(taskArgs.token1) as Token;

        const token0Id = await token0.getCurrencyId();
        const token1Id = await token1.getCurrencyId();

        const UniswapV2Router = await hre.ethers.getContractFactory("UniswapV2Router01");
        const router = UniswapV2Router.attach(routerAddress) as UniswapV2Router01;

        console.log("Router " + routerAddress);

        const result1 = await router.existPairDebug(token0Address, token1Address, walletAddress, MaxUint256, taskArgs.salt)
        console.log("Result1 " + JSON.stringify(result1));


        // const result11 = await router.createPairOnlyDebug(token0Address, token1Address, MaxUint256, taskArgs.salt)
        // console.log("Result11 " + JSON.stringify(result11));

        const result2 = await router.createPairDebug(token0Address, token1Address, MaxUint256, taskArgs.salt)
        console.log("Result2 " + JSON.stringify(result2));

        const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
        const factory = Factory.attach(taskArgs.factory) as UniswapV2Factory;
        const result = await factory.getTokenPair(taskArgs.token0.toLowerCase(), taskArgs.token1.toLowerCase());
        console.log("Result12 " + JSON.stringify(result));

        // const result22 = await router.initDebug(token0Address, token1Address, result.toLowerCase(), MaxUint256)
        // console.log("Result22 " + JSON.stringify(result22));

    });



const addLiquidityAbi: AbiFunction = {
    "inputs": [
        {
            "internalType": "address",
            "name": "tokenA",
            "type": "address"
        },
        {
            "internalType": "address",
            "name": "tokenB",
            "type": "address"
        },
        {
            "internalType": "address",
            "name": "to",
            "type": "address"
        },
        {
            "internalType": "uint256",
            "name": "deadline",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "salt",
            "type": "uint256"
        }
    ],
    "name": "addLiquidity",
    "outputs": [
        {
            "internalType": "uint256",
            "name": "amountA",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "amountB",
            "type": "uint256"
        },
        {
            "internalType": "uint256",
            "name": "liquidity",
            "type": "uint256"
        }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
};

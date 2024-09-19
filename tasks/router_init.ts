import {task} from "hardhat/config";
import {encodeFunctionData} from "viem";
import {Token, UniswapV2Router01, UniswapV2Factory, UniswapV2Pair} from "../typechain-types";
import {client} from "./util/client";
import {AbiFunction} from "abitype/src/abi";

task("router_init", "Router: init and add liquidity")
    .addParam("token0")
    .addParam("token1")
    .addParam("router")
    .addParam("factory")
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
        console.log("Token0Id " + token0Id)
        console.log("Token1Id " + token1Id)

        const UniswapV2Router = await hre.ethers.getContractFactory("UniswapV2Router01");
        const router = UniswapV2Router.attach(routerAddress) as UniswapV2Router01;

        console.log("Router " + routerAddress);

        const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
        const factory = Factory.attach(factoryAddress) as UniswapV2Factory;

        const pairAddress = await factory.getTokenPair(token0Address, token1Address);
        const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
        const pair = Pair.attach(pairAddress) as UniswapV2Pair;

        console.log("Pair token0Id " + await pair.tokenId0())
        console.log("Pair token1Id " + await pair.tokenId1())

        console.log("Pair address - " + pairAddress);

        const hash = await walletV1.sendMessage({
            // @ts-ignore
            to: routerAddress,
            feeCredit: BigInt(10_000_000),
            value: BigInt(0),
            data: encodeFunctionData({
                abi: [addLiquidityAbi],
                functionName: "addLiquidity",
                args: [pairAddress, walletAddress],
            }),
            refundTo: walletAddress,
            tokens: [
                {
                    id: token0Id,
                    amount: BigInt(100_000),
                },
                {
                    id: token1Id,
                    amount: BigInt(100_000),
                }
            ]
        });

        console.log("Added liquidity, tx - " + hash);

        await sleep(3000);

        const reserves = await pair.getReserves();

        console.log("Pair reserves " + reserves);
    });

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}


const addLiquidityAbi: AbiFunction = {
    "inputs": [
        {
            "internalType": "address",
            "name": "pair",
            "type": "address"
        },
        {
            "internalType": "address",
            "name": "to",
            "type": "address"
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
        }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
};

import {task} from "hardhat/config";
import {Token, UniswapV2Pair} from '../typechain-types';

task("initialize", "Swap token0 to token1")
    .addParam("pair", "pair contract")
    .addParam("token0")
    .addParam("token1")
    .addParam("supply")
    .setAction(async (taskArgs, hre) => {
        const walletAddress = process.env.WALLET_ADDR;
        if (!walletAddress) {
            throw new Error("WALLET_ADDR is not set");
        }

        const pairAddress = taskArgs.pair;
        const token0 = taskArgs.token0;
        const token1 = taskArgs.token1;
        const supply = taskArgs.supply;

        const Token0 = await hre.ethers.getContractFactory("Token");
        const token0Contract = Token0.attach(taskArgs.token0) as Token;
        const Token1 = await hre.ethers.getContractFactory("Token");
        const token1Contract = Token1.attach(taskArgs.token1) as Token;

        const token0Id = await token0Contract.getCurrencyId();
        const token1Id = await token1Contract.getCurrencyId();

        console.log("token0Id " + token0Id);
        console.log("token1Id " + token1Id);

        const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
        const pair = Pair.attach(pairAddress) as UniswapV2Pair;

        console.log("initialize ", pairAddress);
        await pair.initialize(token0, token1, token0Id, token1Id);

        console.log("Setting LP token");
        await pair.setLpToken();
        console.log("Token lib set");

        const token0Amount = hre.ethers.parseEther(supply);
        const token1Amount = hre.ethers.parseEther(supply);

        console.log("Adding liquidity...");
        await token0Contract.sendCurrency(pairAddress, token0Id, token0Amount);
        await token1Contract.sendCurrency(pairAddress, token1Id, token1Amount);
        await pair.mint(walletAddress);
        console.log("Liqudity added...");

        console.log("Trying to get reserves...");
        const reserves = await pair.getReserves();

        console.log("Reserves from pair: ", reserves[0], reserves[1]);
    });

import {task} from "hardhat/config";
import {Token, UniswapV2Factory, UniswapV2Pair} from "../typechain-types";

task("flow_swp", "Init pair, mint tokens and run swap")
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

        // Create pair
        let pairAddress = await factory.getTokenPair(taskArgs.token0.toLowerCase(), taskArgs.token1.toLowerCase());
        if (pairAddress == "0x0000000000000000000000000000000000000000") {
            await factory.createPair(token0Address, token1Address, Math.floor(Math.random() * 10000000));
            console.log(`Create pair for ${token0Address} and ${token1Address}`);
        }

        pairAddress = (await factory.getTokenPair(token0Address, token1Address)).toLowerCase();

        console.log("Pair address " + pairAddress);

        // Get token ids
        const Token = await hre.ethers.getContractFactory("Token");
        const token0Contract = Token.attach(token0Address) as Token;
        const token1Contract = Token.attach(token1Address) as Token;

        const token0Id = await token0Contract.getCurrencyId();
        const token1Id = await token1Contract.getCurrencyId();

        console.log("Token0Id " + token0Id);
        console.log("Token1Id " + token1Id);

        // Init pair
        const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
        const pair = Pair.attach(pairAddress) as UniswapV2Pair;

        await pair.initialize(token0Address, token1Address, token0Id, token1Id);
        console.log("Inited pair")


        // Mint tokens
        await token0Contract.mintCurrencyInternal(100000000)
        await token1Contract.mintCurrencyInternal(100000000)
        console.log("Minted token0 and token1")
        await token0Contract.sendCurrencyInternal(pairAddress, token0Id, 10000)
        await token1Contract.sendCurrencyInternal(pairAddress, token1Id, 10000)
        console.log("Sent token0 and token1 to the pair contract")

        // Case 1: Mint pair tokens
        console.log("Start mint")

        console.log("Token0 pair balance " + await token0Contract.getCurrencyBalanceOf(pairAddress));
        console.log("Token1 pair balance " + await token1Contract.getCurrencyBalanceOf(pairAddress));

        await pair.mint(walletAddress);
        console.log("Minted pair tokens")

        console.log("User wallet pair token balance " + await pair.getCurrencyBalanceOf(walletAddress))
        const reserves = await pair.getReserves();
        console.log("Reserves from pair: ", reserves[0], reserves[1]);


        // Case 2: Swap tokens
        console.log("Start swap")

        const balanceToken0Before = await token0Contract.getCurrencyBalanceOf(walletAddress);
        const balanceToken1Before = await token1Contract.getCurrencyBalanceOf(walletAddress);
        console.log("User balance token0 before:", balanceToken0Before);
        console.log("User balance token1 before:", balanceToken1Before);

        await token0Contract.sendCurrencyInternal(pairAddress, token0Id, 10000)
        console.log("Sent token0 to the pair contract")

        await pair.swap(0, 1000, walletAddress);
        console.log("Swapped")
        const balanceToken0After = await token0Contract.getCurrencyBalanceOf(walletAddress);
        const balanceToken1After = await token1Contract.getCurrencyBalanceOf(walletAddress);

        console.log("User balance token0 after:", balanceToken0After);
        console.log("User balance token1 after:", balanceToken1After);
    });

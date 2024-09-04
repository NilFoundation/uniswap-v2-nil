import {task} from "hardhat/config";
import {UniswapV2Pair} from '../typechain-types';

task("swap", "Swap token0 to token1")
    .addParam("pair", "pair contract")
    .addParam("token0")
    .addParam("token1")
    .addParam("amount", "amount of token0 to swap")
    .setAction(async (taskArgs, hre) => {
        const walletAddress = process.env.WALLET_ADDR;
        if (!walletAddress) {
            throw new Error("WALLET_ADDR is not set");
        }

        const pairAddress = taskArgs.pair;
        const token0Address = taskArgs.token0;
        const token1Address = taskArgs.token1;
        const swapAmount = hre.ethers.parseEther(taskArgs.amount);

        const poolAmount = swapAmount + swapAmount;

        const Token0 = await hre.ethers.getContractAt("Token", token0Address);
        const Token1 = await hre.ethers.getContractAt("Token", token1Address);

        const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
        const pair = Pair.attach(pairAddress) as UniswapV2Pair;

        const token0 = await pair.token0();
        const token1 = await pair.token1();
        const token0Id = await Token0.getCurrencyId();
        const token1Id = await Token1.getCurrencyId();

        const reserves = await pair.getReserves();
        const reserve0 = reserves[0];
        const reserve1 = reserves[1];
        console.log("Reserves from pair: ", reserves[0], reserves[1]);

        const expectedOutputAmount = calculateOutputAmount(swapAmount, reserve0, reserve1);
        console.log("expected output amount: ", expectedOutputAmount);

        const balanceToken0Before = await Token0.balanceOf(walletAddress);
        const balanceToken1Before = await Token1.balanceOf(walletAddress);

        console.log("Balance token0 before:", balanceToken0Before.toString());
        console.log("Balance token1 before:", balanceToken1Before.toString());

        console.log("Send currency 0" + poolAmount);
        await Token0.sendCurrency(pairAddress, token0Id, poolAmount);
        console.log("Send currency 1" + poolAmount);
        await Token0.sendCurrency(pairAddress, token1Id, poolAmount);

        console.log("Swapping...");
        try {
            await pair.swap(0, expectedOutputAmount, walletAddress, '0x');
        } catch (error: any) {
            console.log("USAOOOO")
            if (error?.error?.data?.message) {
                console.error("Swap failed with revert reason:", error.error.data.message);
            } else {
                console.error("Swap failed:", error);
            }
        }

        const balanceToken0After = await Token0.balanceOf(walletAddress);
        const balanceToken1After = await Token1.balanceOf(walletAddress);

        console.log("Balance token0 after:", JSON.stringify(balanceToken0After));
        console.log("Balance token1 after:", JSON.stringify(balanceToken1After));
    });

function calculateOutputAmount(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
    const amountInWithFee = amountIn * BigInt(997);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * BigInt(1000) + amountInWithFee;
    return numerator / denominator;
}

import { task } from "hardhat/config";
import { UniswapV2Pair } from '../typechain-types';
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("swap", "Swap token0 to token1")
.addParam("pair", "pair contract")
.addParam("lib", "lib contract")
.addParam("amount", "amount of token0 to swap")
.setAction(async (taskArgs, hre) => {
	const walletAddress = "0x000198db563c7db21Fb39D725595E771890C16Fd";


	const pairAddress = taskArgs.pair;
	const tokenLibAddress = taskArgs.lib;
	const swapAmount = hre.ethers.parseEther(taskArgs.amount);

	const tokenLib = await hre.ethers.getContractAt("TokenLibrary", tokenLibAddress);

	const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
	const pair = Pair.attach(pairAddress) as UniswapV2Pair;

	const token0 = await pair.token0();
	const token1 = await pair.token1();

	const reserves = await pair.getReserves();
	const reserve0 = reserves[0];
	const reserve1 = reserves[1];
	console.log("Reserves from pair: ", reserves[0], reserves[1]);

	const expectedOutputAmount = calculateOutputAmount(swapAmount, reserve0, reserve1);
	console.log("expected output amount: ", expectedOutputAmount);

	const balanceToken0Before = await tokenLib.getBalance(token0, walletAddress);
	const balanceToken1Before = await tokenLib.getBalance(token1, walletAddress);

	console.log("Balance token0 before:", balanceToken0Before.toString());
	console.log("Balance token1 before:", balanceToken1Before.toString());

	console.log("Swapping...");
	await tokenLib.transfer(token0, await pair.getAddress(), swapAmount);

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

	const balanceToken0After = await tokenLib.getBalance(token0, walletAddress);
	const balanceToken1After = await tokenLib.getBalance(token1, walletAddress);

	console.log("Balance token0 after:", balanceToken0After.toString());
	console.log("Balance token1 after:", balanceToken1After.toString());
});

function calculateOutputAmount(amountIn: bigint, reserveIn: bigint, reserveOut: bigint): bigint {
	const amountInWithFee = amountIn * BigInt(997);
	const numerator = amountInWithFee * reserveOut;
	const denominator = reserveIn * BigInt(1000) + amountInWithFee;
	return numerator / denominator;
}

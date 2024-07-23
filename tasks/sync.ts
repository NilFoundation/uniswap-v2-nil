import { task } from "hardhat/config";
import { UniswapV2Pair } from '../typechain-types';
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("sync", "Force reserves to match balances")
.addParam("pair", "The address of the pair contract")
.addParam("lib", "The address of the token library contract")
.setAction(async (taskArgs, hre) => {
	const walletAddress = process.env.WALLET_ADDR;
	if (!walletAddress) {
		throw new Error("WALLET_ADDR is not set");
	}

	const pairAddress = taskArgs.pair;
	const tokenLibAddress = taskArgs.lib;

	const tokenLib = await hre.ethers.getContractAt("TokenLibrary", tokenLibAddress);
	const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
	const pair = Pair.attach(pairAddress) as UniswapV2Pair;

	console.log("Pair address", pairAddress);

	console.log("Executing sync...");
	await pair.sync();

	const reserves = await pair.getReserves();
	console.log("Reserves from pair after sync: ", reserves[0], reserves[1]);

	const token0 = await pair.token0();
	const token1 = await pair.token1();

	const balanceToken0 = await tokenLib.getBalance(token0, walletAddress);
	const balanceToken1 = await tokenLib.getBalance(token1, walletAddress);

	console.log("Balance token0 after sync:", balanceToken0.toString());
	console.log("Balance token1 after sync:", balanceToken1.toString());
});

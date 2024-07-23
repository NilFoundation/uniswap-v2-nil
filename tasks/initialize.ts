import { task } from "hardhat/config";
import { UniswapV2Pair } from '../typechain-types';
import { HardhatRuntimeEnvironment } from "hardhat/types";


task("initialize", "Swap token0 to token1")
.addParam("pair", "pair contract")
.addParam("lib", "lib contract")
.setAction(async (taskArgs, hre) => {
	const walletAddress = process.env.WALLET_ADDR;
	if (!walletAddress) {
		throw new Error("WALLET_ADDR is not set");
	}

	const pairAddress = taskArgs.pair;
	const tokenLibAddress = taskArgs.lib;

	const tokenLib = await hre.ethers.getContractAt("TokenLibrary", tokenLibAddress);

	const nameTokenA = "TokenA";
	const symbolTokenA = "TA";
	const nameTokenB = "TokenB";
	const symbolTokenB = "TB";
	const decimals = 18;
	const supply = hre.ethers.parseEther("1000");

	await tokenLib.newToken(
		nameTokenA,
		symbolTokenA,
		decimals,
		supply,
		walletAddress
	);

	await tokenLib.newToken(
		nameTokenB,
		symbolTokenB,
		decimals,
		supply,
		walletAddress
	);

	const token0 = calculateAddress(hre, nameTokenA, symbolTokenA);
	const token1 = calculateAddress(hre, nameTokenB, symbolTokenB);

	const token0Info = await tokenLib.tokens(token0);
	const token1Info = await tokenLib.tokens(token1);

	console.log("token info:");
	console.log(token0Info);
	console.log(token1Info);
	console.log();


	const token0Balance = await tokenLib.getBalance(token0, walletAddress);
	const token1Balance = await tokenLib.getBalance(token1, walletAddress);

	console.log("token balance:");
	console.log(token0Balance);
	console.log(token1Balance);
	console.log();

	const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
	const pair = Pair.attach(pairAddress) as UniswapV2Pair;

	console.log("Pair address", pairAddress);
	await pair.initialize(token0, token1);

	console.log("Setting token lib...");
	await pair.setTokenLib(tokenLibAddress);
	console.log("Token lib set");

	const tokenLibFromContract = await pair.tokenLib();
	console.log("tokenLib:", tokenLibFromContract);

	const lpToken = await pair.lpToken();
	console.log("lpToken:", lpToken);

	const token0Amount = hre.ethers.parseEther("5");
	const token1Amount = hre.ethers.parseEther("10");

	console.log("Adding liquidity...");
	await tokenLib.transfer(token0, await pair.getAddress(), token0Amount);
	await tokenLib.transfer(token1, await pair.getAddress(), token1Amount);
	await pair.mint(walletAddress);
	console.log("Liqudity added...");

	console.log("Trying to get reserves...");
	const reserves = await pair.getReserves();

	console.log("Reserves from pair: ", reserves[0], reserves[1]);

	const balanceToken0Before = await tokenLib.getBalance(token0, walletAddress);
	const balanceToken1Before = await tokenLib.getBalance(token1, walletAddress);

	console.log("Balance token0:", balanceToken0Before.toString());
	console.log("Balance token1:", balanceToken1Before.toString());
});



function calculateAddress(hre: HardhatRuntimeEnvironment, name: string, symbol: string): string {
	const hash = hre.ethers.solidityPackedKeccak256(["string", "string"], [name, symbol]);
	return `0x${hash.slice(hash.length - 40, hash.length)}`;
}
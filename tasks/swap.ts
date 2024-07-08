import { task } from "hardhat/config";
import { TokenLibrary, UniswapV2Factory, UniswapV2Pair } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from "hardhat/types";


task("swap", "Swap token0 to token1")
	.addParam("pair", "pair contract")
	.addParam("lib", "lib contract")
	.setAction(async (taskArgs, hre) => {
		const walletAddress = "0x00016600EAb745CaFEDaa8961cC8162e0AF4b592";

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

		// console.log("Creating pair....");
		// await factory.createPair(token0, token1);
		// console.log("Pair created");
		// const pairAddress = await factory.getPair(token0, token1);

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
		await pair.mint(hre.ethers.ZeroAddress);
		console.log("Liqudity added...");

		console.log("Trying to get reserves...");
		const reserves = await pair.getReserves();

		console.log(reserves)

		const balanceToken0 = await pair.balanceToken0();
		const balanceToken1 = await pair.balanceToken1();

		console.log("balanceToken0", balanceToken0);
		console.log("balanceToken1", balanceToken1);

		const balancePairToken0 = await tokenLib.getBalance(token0, pairAddress);
		const balancePairToken1 = await tokenLib.getBalance(token1, pairAddress);

		console.log("balancePairToken0", balancePairToken0);
		console.log("balancePairToken1", balancePairToken1);

		const swapAmount = hre.ethers.parseEther("1")
		const expectedOutputAmount = BigInt('1662497915624478906')

		const balanceToken0Before = await tokenLib.getBalance(token0, walletAddress);
		const balanceToken1Before = await tokenLib.getBalance(token1, walletAddress);

		console.log("Balance token0 before:", balanceToken0Before.toString());
		console.log("Balance token1 before:", balanceToken1Before.toString());

		console.log("Swapping...");
		await tokenLib.transfer(token0, await pair.getAddress(), swapAmount)

		await pair.swap(0, expectedOutputAmount, walletAddress, '0x');

		const balanceToken0After = await tokenLib.getBalance(token0, walletAddress);
		const balanceToken1After = await tokenLib.getBalance(token1, walletAddress);

		console.log("Balance token0 after:", balanceToken0After.toString());
		console.log("Balance token1 after:", balanceToken1After.toString());
	});


async function addLiquidity(tokenLib: TokenLibrary, pair: UniswapV2Pair, signer: SignerWithAddress, token0Amount: bigint, token1Amount: bigint, token0: string, token1: string) {
	await tokenLib.transfer(token0, await pair.getAddress(), token0Amount);
	await tokenLib.transfer(token1, await pair.getAddress(), token1Amount);
	await pair.mint(signer.address);
}

function calculateAddress(hre: HardhatRuntimeEnvironment, name: string, symbol: string): string {
	const hash = hre.ethers.solidityPackedKeccak256(["string", "string"], [name, symbol]);
	return `0x${hash.slice(hash.length - 40, hash.length)}`;
}

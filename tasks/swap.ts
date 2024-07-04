import { task } from "hardhat/config";
import { TokenLibrary, UniswapV2Factory, UniswapV2Pair } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { HardhatRuntimeEnvironment } from "hardhat/types";


task("swap", "Swap token0 to token1")
	.addParam("factory", "factory contract")
	.setAction(async (taskArgs, hre) => {
		const factoryAddress = taskArgs.factory;

		const [signer] = await hre.ethers.getSigners();

		const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
		const factory = Factory.attach(factoryAddress) as UniswapV2Factory;

		console.log(factoryAddress)
		const tokenLibAddress = await factory.getTokenLib();
		console.log(tokenLibAddress);

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
			signer.address
		);

		await tokenLib.newToken(
			nameTokenB,
			symbolTokenB,
			decimals,
			supply,
			signer.address
		);

		const token0 = calculateAddress(hre, nameTokenA, symbolTokenA);
		const token1 = calculateAddress(hre, nameTokenB, symbolTokenB);

		console.log(token0);
		console.log(token1);

		console.log("Creating pair....");
		await factory.createPair(token0, token1);

		const pairAddress = await factory.getPair(token0, token1);
		const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
		const pair = Pair.attach(pairAddress) as UniswapV2Pair;
		console.log("Pair address", pairAddress);

		const token0Amount = hre.ethers.parseEther("5");
		const token1Amount = hre.ethers.parseEther("10");









		console.log("Adding liquidity...");
		await tokenLib.transfer(token0, await pair.getAddress(), token0Amount);
		await tokenLib.transfer(token1, await pair.getAddress(), token1Amount);
		await pair.mint(signer.address);
		console.log("Liqudity added...");

		// const swapAmount = hre.ethers.parseEther("1")
		// const expectedOutputAmount = BigInt('1662497915624478906')

		// const balanceToken0Before = await tokenLib.balanceOf(token0, signer.address);
		// const balanceToken1Before = await tokenLib.balanceOf(token1, signer.address);

		// console.log("Balance token0 before:", balanceToken0Before.toString());
		// console.log("Balance token1 before:", balanceToken1Before.toString());

		// console.log("Swapping...");
		// await tokenLib.transfer(token0, await pair.getAddress(), swapAmount)

		// await pair.swap(0, expectedOutputAmount, signer.address, '0x');

		// const balanceToken0After = await tokenLib.balanceOf(token0, signer.address);
		// const balanceToken1After = await tokenLib.balanceOf(token1, signer.address);

		// console.log("Balance token0 after:", balanceToken0After.toString());
		// console.log("Balance token1 after:", balanceToken1After.toString());
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

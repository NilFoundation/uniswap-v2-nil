import { task } from "hardhat/config";
import { time } from "@nomicfoundation/hardhat-network-helpers"
import { TokenLibrary, UniswapV2Factory, UniswapV2Pair } from '../typechain-types';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';


task("swap", "Swap token0 to token1")
	.addParam("factory", "factory contract")
	.setAction(async (taskArgs, hre) => {
		const factoryAddress = taskArgs.factory;

		const [signer] = await hre.ethers.getSigners();

		const factory = await hre.ethers.getContractAt("UniswapV2Factory", factoryAddress) as unknown as UniswapV2Factory;

		console.log(factoryAddress)
		const tokenLibAddress = await factory.getTokenLib();
		console.log(tokenLibAddress);

		const tokenLib = await hre.ethers.getContractAt("TokenLibrary", tokenLibAddress);

		const nameTokenA = "TokenA";
		const nameTokenASymbol = "TA";
		const nameTokenB = "TokenB";
		const nameTokenBSymbol = "TB";
		const decimals = 18;
		const supply = hre.ethers.parseEther("1000");

		await tokenLib.newToken(
			nameTokenA,
			nameTokenASymbol,
			decimals,
			supply,
			signer.address
		);

		await tokenLib.newToken(
			nameTokenB,
			nameTokenBSymbol,
			decimals,
			supply,
			signer.address
		);


		let blk = await time.latestBlock();
		const tokenCreatedFilter = tokenLib.filters.TokenCreated;
		let events = await tokenLib.queryFilter(tokenCreatedFilter, blk);

		const token1 = events[0].args[0];
		const token0 = events[1].args[0];

		console.log(token0);
		console.log(token1);

		await factory.createPair(token0, token1);
		const pairCreatedFilter = factory.filters.PairCreated;

		blk = await time.latestBlock();
		events = await factory.queryFilter(pairCreatedFilter, blk);
		const pairAddress = events[0].args?.[2]

		const pair = await hre.ethers.getContractAt("UniswapV2Pair", pairAddress);

		const token0Amount = hre.ethers.parseEther("5");
		const token1Amount = hre.ethers.parseEther("10");

		console.log("Adding liquidity...");
		await addLiquidity(tokenLib, pair, signer, token0Amount, token1Amount, token0, token1);
		console.log("Liqudity added...");

		const swapAmount = hre.ethers.parseEther("1")
		const expectedOutputAmount = BigInt('1662497915624478906')

		const balanceToken0Before = await tokenLib.balanceOf(token0, signer.address);
		const balanceToken1Before = await tokenLib.balanceOf(token1, signer.address);

		console.log("Balance token0 before:", balanceToken0Before.toString());
		console.log("Balance token1 before:", balanceToken1Before.toString());

		console.log("Swapping...");
		await tokenLib.transfer(token0, await pair.getAddress(), swapAmount)

		await pair.swap(0, expectedOutputAmount, signer.address, '0x');

		const balanceToken0After = await tokenLib.balanceOf(token0, signer.address);
		const balanceToken1After = await tokenLib.balanceOf(token1, signer.address);

		console.log("Balance token0 after:", balanceToken0After.toString());
		console.log("Balance token1 after:", balanceToken1After.toString());
	});


async function addLiquidity(tokenLib: TokenLibrary, pair: UniswapV2Pair, signer: SignerWithAddress, token0Amount: bigint, token1Amount: bigint, token0: string, token1: string) {
	await tokenLib.transfer(token0, await pair.getAddress(), token0Amount);
	await tokenLib.transfer(token1, await pair.getAddress(), token1Amount);
	await pair.mint(signer.address);
}

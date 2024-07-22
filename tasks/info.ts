import { task } from "hardhat/config";
import { UniswapV2Pair } from '../typechain-types';
import { HardhatRuntimeEnvironment } from "hardhat/types";

task("info", "Fetch reserves and pair balances")
.addParam("pair", "pair contract address")
.addParam("lib", "token library contract address")
.setAction(async (taskArgs, hre) => {
	const pairAddress = taskArgs.pair;
	const tokenLibAddress = taskArgs.lib;

	const tokenLib = await hre.ethers.getContractAt("TokenLibrary", tokenLibAddress);
	const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
	const pair = Pair.attach(pairAddress) as UniswapV2Pair;

	const token0 = await pair.token0();
	const token1 = await pair.token1();

	const reserves = await pair.getReserves();
	console.log("Reserves from pair: ", reserves[0].toString(), reserves[1].toString());

	const balanceToken0 = await tokenLib.getBalance(token0, pairAddress);
	const balanceToken1 = await tokenLib.getBalance(token1, pairAddress);
	console.log("Balance of token0 in pair:", balanceToken0.toString());
	console.log("Balance of token1 in pair:", balanceToken1.toString());
});

function calculateAddress(hre: HardhatRuntimeEnvironment, name: string, symbol: string): string {
	const hash = hre.ethers.solidityPackedKeccak256(["string", "string"], [name, symbol]);
	return `0x${hash.slice(hash.length - 40, hash.length)}`;
}

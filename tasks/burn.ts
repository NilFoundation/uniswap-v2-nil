import { task } from "hardhat/config";
import { UniswapV2Pair } from '../typechain-types';

task("burn", "Burn liquidity tokens and print balances and reserves")
.addParam("pair", "The address of the pair contract")
.addParam("lib", "The address of the token library contract")
.addParam("to", "The address to transfer the burned tokens to")
.setAction(async (taskArgs, hre) => {
	const walletAddress = process.env.WALLET_ADDR;
	if (!walletAddress) {
		throw new Error("WALLET_ADDR is not set");
	}

	const pairAddress = taskArgs.pair;
	const toAddress = taskArgs.to;

	const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
	const pair = Pair.attach(pairAddress) as UniswapV2Pair;

	console.log("Pair address", pairAddress);
	console.log("To address", toAddress);

	const lpToken = await pair.lpToken();
	const liquidity = await pair.balanceOf(walletAddress);
	console.log("Liquidity to burn:", liquidity.toString());

	// Approve the pair contract to spend LP tokens
	console.log("Approving pair contract to spend LP tokens...");
	const approveTx = await tokenLib.approve(lpToken, pairAddress, liquidity);
	await approveTx.wait();
	console.log("Approved.");

	// Transfer LP tokens to pair contract and burn
	console.log("Transferring LP tokens to pair contract and burning...");

	const transferTx = await tokenLib.transferFrom(lpToken, walletAddress, pairAddress, liquidity);
	await transferTx.wait();
	console.log("Transferred.");

	// Execute burn
	console.log("Executing burn...");
	const burnTx = await pair.burn(toAddress);
	await burnTx.wait();
	console.log("Burn executed.");

	// Fetch and print balances and reserves after burn
	const token0 = await pair.token0();
	const token1 = await pair.token1();
	const balanceToken0 = await tokenLib.getBalance(token0, walletAddress);
	const balanceToken1 = await tokenLib.getBalance(token1, walletAddress);

	console.log("Balance token0 after burn:", balanceToken0.toString());
	console.log("Balance token1 after burn:", balanceToken1.toString());

	const reserves = await pair.getReserves();
	console.log("Reserves from pair after burn: ", reserves[0].toString(), reserves[1].toString());
});

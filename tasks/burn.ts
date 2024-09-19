import { task } from "hardhat/config";
import type { Token, UniswapV2Pair, Wallet } from "../typechain-types";

task("burn", "Burn liquidity tokens and print balances and reserves")
  .addParam("pair", "The address of the pair contract")
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

    const token0 = await pair.token0();
    console.log("Token0 ", token0.toString());
    const token1 = await pair.token1();
    console.log("Token1 ", token1.toString());
    const Token = await hre.ethers.getContractFactory("Token");
    const token0Contract = Token.attach(token0.toLowerCase()) as Token;
    const token1Contract = Token.attach(token1.toLowerCase()) as Token;

    console.log("Pair address", pairAddress);
    console.log("To address", toAddress);

    await pair.mintCurrencyPublic(100);

    const liquidity = await pair.getOwnCurrencyBalance();
    console.log("Liquidity:", liquidity.toString());
    const total = await pair.getCurrencyTotalSupply();
    console.log("Total: ", total.toString());

    const pairBalanceToken0 = await token0Contract.getCurrencyBalanceOf(
      pairAddress.toLowerCase(),
    );
    const pairBalanceToken1 = await token1Contract.getCurrencyBalanceOf(
      pairAddress.toLowerCase(),
    );

    console.log(
      "Pair Balance token0 after burn:",
      pairBalanceToken0.toString(),
    );
    console.log(
      "Pair Balance token1 after burn:",
      pairBalanceToken1.toString(),
    );

    const Wallet = await hre.ethers.getContractFactory("Wallet");
    const wallet = Wallet.attach(walletAddress) as Wallet;

    const sentLp = await wallet.sendCurrencyPublic(
      pairAddress.toLowerCase(),
      await pair.getCurrencyId(),
      100,
    );

    // Execute burn
    console.log("Executing burn...");
    const burnTx = await pair.burn(toAddress);
    await burnTx.wait();
    console.log("Burn executed.");

    console.log("Built tokens");

    const balanceToken0 = await token0Contract.getCurrencyBalanceOf(
      walletAddress.toLowerCase(),
    );
    const balanceToken1 = await token1Contract.getCurrencyBalanceOf(
      walletAddress.toLowerCase(),
    );

    console.log("Balance token0 after burn:", balanceToken0.toString());
    console.log("Balance token1 after burn:", balanceToken1.toString());

    const reserves = await pair.getReserves();
    console.log(
      "Reserves from pair after burn: ",
      reserves[0].toString(),
      reserves[1].toString(),
    );
  });

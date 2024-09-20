import { task } from "hardhat/config";
import type {Currency, UniswapV2Pair} from "../../../typechain-types";
import {UserWallet} from "../../../typechain-types";

task("burn", "Burn liquidity tokens and print balances and reserves")
  .addParam("pair", "The address of the pair contract")
  .addParam("wallet", "The address to transfer the burned tokens to")
  .setAction(async (taskArgs, hre) => {
    const pairAddress = taskArgs.pair;
    const toAddress = taskArgs.to;

    const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
    const pair = Pair.attach(pairAddress) as UniswapV2Pair;

    const token0 = await pair.token0();
    console.log("Token0 ", token0.toString());
    const token1 = await pair.token1();
    console.log("Token1 ", token1.toString());

    const Token = await hre.ethers.getContractFactory("Currency");
    const token0Contract = Token.attach(token0.toLowerCase()) as Currency;
    const token1Contract = Token.attach(token1.toLowerCase()) as Currency;

    const total = await pair.getCurrencyTotalSupply();
    console.log("Total supply: ", total.toString());

    const pairBalanceToken0 = await token0Contract.getCurrencyBalanceOf(
      pairAddress.toLowerCase(),
    );
    const pairBalanceToken1 = await token1Contract.getCurrencyBalanceOf(
      pairAddress.toLowerCase(),
    );

    console.log(
      "Pair Balance token0 before burn:",
      pairBalanceToken0.toString(),
    );
    console.log(
      "Pair Balance token1 before burn:",
      pairBalanceToken1.toString(),
    );

    let userBalanceToken0 = await token0Contract.getCurrencyBalanceOf(
        taskArgs.wallet,
    );
    let userBalanceToken1 = await token1Contract.getCurrencyBalanceOf(
        taskArgs.wallet,
    );

    console.log(
        "User Balance token0 before burn:",
        userBalanceToken0.toString(),
    );
    console.log(
        "User Balance token1 before burn:",
        userBalanceToken1.toString(),
    );

    // Attach to the User contracts
    const UserFactory = await hre.ethers.getContractFactory("UserWallet");
    const user = UserFactory.attach(taskArgs.wallet) as UserWallet;

    const lpAddress = await pair.getCurrencyId()
    const userLpBalance = await pair.getCurrencyBalanceOf(taskArgs.wallet);
    console.log("Total LP balance for user wallet:", userLpBalance.toString());

    const sentLp = await user.sendCurrencyPublic(
      pairAddress.toLowerCase(),
        lpAddress,
        userLpBalance,
    );

    // Execute burn
    console.log("Executing burn...");
    await pair.burn(taskArgs.wallet);
    console.log("Burn executed.");

    console.log("Built tokens");

    const balanceToken0 = await token0Contract.getCurrencyBalanceOf(
        pairAddress.toLowerCase(),
    );
    const balanceToken1 = await token1Contract.getCurrencyBalanceOf(
        pairAddress.toLowerCase(),
    );

    console.log("Pair Balance token0 after burn:", balanceToken0.toString());
    console.log("Pair Balance token1 after burn:", balanceToken1.toString());

    userBalanceToken0 = await token0Contract.getCurrencyBalanceOf(
        taskArgs.wallet,
    );
    userBalanceToken1 = await token1Contract.getCurrencyBalanceOf(
        taskArgs.wallet,
    );

    console.log(
        "User Balance token0 after burn:",
        userBalanceToken0.toString(),
    );
    console.log(
        "User Balance token1 after burn:",
        userBalanceToken1.toString(),
    );

    const reserves = await pair.getReserves();
    console.log(
      "Reserves from pair after burn: ",
      reserves[0].toString(),
      reserves[1].toString(),
    );


  });

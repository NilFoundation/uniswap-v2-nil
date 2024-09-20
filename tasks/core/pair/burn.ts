import { task } from "hardhat/config";
import type { Currency, UniswapV2Pair } from "../../../typechain-types";
import type { UserWallet } from "../../../typechain-types";

task("burn", "Burn liquidity tokens and print balances and reserves")
  .addParam("pair", "The address of the pair contract")
  .addParam("wallet", "The address to transfer the burned tokens to")
  .setAction(async (taskArgs, hre) => {
    // Destructure parameters for clarity
    const pairAddress = taskArgs.pair;
    const walletAddress = taskArgs.wallet;

    // Attach to the Uniswap V2 Pair contract
    const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
    const pair = Pair.attach(pairAddress) as UniswapV2Pair;

    const token0 = await pair.token0();
    console.log("Token0:", token0.toString());
    const token1 = await pair.token1();
    console.log("Token1:", token1.toString());

    // Attach to the Currency contracts
    const Token = await hre.ethers.getContractFactory("Currency");
    const token0Contract = Token.attach(token0.toLowerCase()) as Currency;
    const token1Contract = Token.attach(token1.toLowerCase()) as Currency;

    const total = await pair.getCurrencyTotalSupply();
    console.log("Total supply:", total.toString());

    // Fetch and log pair balances before burn
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

    // Fetch and log user balances before burn
    let userBalanceToken0 =
      await token0Contract.getCurrencyBalanceOf(walletAddress);
    let userBalanceToken1 =
      await token1Contract.getCurrencyBalanceOf(walletAddress);
    console.log(
      "User Balance token0 before burn:",
      userBalanceToken0.toString(),
    );
    console.log(
      "User Balance token1 before burn:",
      userBalanceToken1.toString(),
    );

    // Attach to the UserWallet contract
    const UserFactory = await hre.ethers.getContractFactory("UserWallet");
    const user = UserFactory.attach(walletAddress) as UserWallet;

    const lpAddress = await pair.getCurrencyId();
    const userLpBalance = await pair.getCurrencyBalanceOf(walletAddress);
    console.log("Total LP balance for user wallet:", userLpBalance.toString());

    // Send LP tokens to the user wallet
    await user.sendCurrencyPublic(
      pairAddress.toLowerCase(),
      lpAddress,
      userLpBalance,
    );

    // Execute burn
    console.log("Executing burn...");
    await pair.burn(walletAddress);
    console.log("Burn executed.");
    console.log("Built tokens");

    // Log balances after burn
    const balanceToken0 = await token0Contract.getCurrencyBalanceOf(
      pairAddress.toLowerCase(),
    );
    const balanceToken1 = await token1Contract.getCurrencyBalanceOf(
      pairAddress.toLowerCase(),
    );
    console.log("Pair Balance token0 after burn:", balanceToken0.toString());
    console.log("Pair Balance token1 after burn:", balanceToken1.toString());

    userBalanceToken0 =
      await token0Contract.getCurrencyBalanceOf(walletAddress);
    userBalanceToken1 =
      await token1Contract.getCurrencyBalanceOf(walletAddress);
    console.log(
      "User Balance token0 after burn:",
      userBalanceToken0.toString(),
    );
    console.log(
      "User Balance token1 after burn:",
      userBalanceToken1.toString(),
    );

    // Fetch and log reserves after burn
    const reserves = await pair.getReserves();
    console.log(
      "Reserves from pair after burn:",
      reserves[0].toString(),
      reserves[1].toString(),
    );
  });

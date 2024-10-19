import { shardNumber } from "@nilfoundation/hardhat-plugin/dist/utils/conversion";
import { waitTillCompleted } from "@nilfoundation/niljs";
import { task } from "hardhat/config";
import { encodeFunctionData } from "viem";
import { createClient } from "../util/client";
import { initCurrency } from "../util/currency-init";
import { mintAndSendCurrency } from "../util/currency-utils";
import { deployDex } from "../util/dex-deployment";
import { calculateOutputAmount } from "../util/math";
import { initPair } from "../util/pair-init";

task("demo-router", "Run demo with Uniswap Router").setAction(
  async (taskArgs, hre) => {
    const walletAddress = process.env.WALLET_ADDR;
    if (!walletAddress) {
      throw new Error("WALLET_ADDR is not set in environment variables");
    }

    const mintAmount = 100000;
    const mintCurrency0Amount = 10000;
    const mintCurrency1Amount = 10000;
    const swapAmount = 1000;

    const { wallet, publicClient, signer } = await createClient();

    console.log("Deploying...");
    const { factory, routerAddress } = await deployDex(hre);
    console.log("Dex deployed, router - " + routerAddress);

    const {
      address: token0Address,
      currency: token0Contract,
      id: token0Id,
    } = await initCurrency("Token0", mintAmount, hre);
    const {
      address: token1Address,
      currency: token1Contract,
      id: token1Id,
    } = await initCurrency("Token1", mintAmount, hre);

    const { address: pairAddress, pair } = await initPair(
      token0Address,
      token1Address,
      factory,
      hre,
    );
    console.log("Pair deployed " + pairAddress);

    console.log(`Pair initialized successfully at address: ${pairAddress}`);

    // 2. MINT CURRENCIES
    console.log(
      `Minting ${mintAmount} Currency0 to wallet ${walletAddress}...`,
    );
    await mintAndSendCurrency({
      publicClient,
      signer,
      currencyContract: token0Contract,
      contractAddress: token0Address,
      walletAddress,
      mintAmount,
      hre,
    });

    // Mint and send Currency1
    console.log(
      `Minting ${mintAmount} Currency1 to wallet ${walletAddress}...`,
    );
    await mintAndSendCurrency({
      publicClient,
      signer,
      currencyContract: token1Contract,
      contractAddress: token1Address,
      walletAddress,
      mintAmount,
      hre,
    });

    // Verify the balance of the recipient wallet for both currencies
    const recipientBalanceCurrency0 =
      await token0Contract.getCurrencyBalanceOf(walletAddress);
    const recipientBalanceCurrency1 =
      await token1Contract.getCurrencyBalanceOf(walletAddress);

    console.log(
      `Recipient balance after transfer - Currency0: ${recipientBalanceCurrency0}, Currency1: ${recipientBalanceCurrency1}`,
    );

    // 3. ROUTER: ADD LIQUIDITY
    const routerArtifact =
      await hre.artifacts.readArtifact("UniswapV2Router01");

    // Mint liquidity
    console.log("Adding liquidity...");

    const hash = await wallet.sendMessage({
      to: routerAddress,
      feeCredit: BigInt(10_000_000),
      value: BigInt(0),
      refundTo: wallet.address,
      data: encodeFunctionData({
        abi: routerArtifact.abi,
        functionName: "addLiquidity",
        args: [pairAddress, walletAddress],
      }),
      tokens: [
        {
          id: token0Address,
          amount: BigInt(mintCurrency0Amount),
        },
        {
          id: token1Address,
          amount: BigInt(mintCurrency1Amount),
        },
      ],
    });

    await waitTillCompleted(publicClient, shardNumber(walletAddress), hash);

    // Log balances in the pair contract
    const pairCurrency0Balance =
      await token0Contract.getCurrencyBalanceOf(pairAddress);
    console.log("Pair Balance of Currency0:", pairCurrency0Balance.toString());

    const pairCurrency1Balance =
      await token1Contract.getCurrencyBalanceOf(pairAddress);
    console.log("Pair Balance of Currency1:", pairCurrency1Balance.toString());

    console.log("Liquidity added...");

    // Retrieve and log reserves from the pair
    const [reserve0, reserve1] = await pair.getReserves();
    console.log(
      `ADDLIQUIDITY RESULT: Reserves - Currency0: ${reserve0.toString()}, Currency1: ${reserve1.toString()}`,
    );

    // Check and log liquidity provider balance
    const lpBalance = await pair.getCurrencyBalanceOf(walletAddress);
    console.log(
      "ADDLIQUIDITY RESULT: Liquidity provider balance in wallet:",
      lpBalance.toString(),
    );

    // Retrieve and log total supply for the pair
    const totalSupply = await pair.getCurrencyTotalSupply();
    console.log(
      "ADDLIQUIDITY RESULT: Total supply of pair tokens:",
      totalSupply.toString(),
    );

    // 4. ROUTER: SWAP
    const expectedOutputAmount = calculateOutputAmount(
      BigInt(swapAmount),
      reserve0,
      reserve1,
    );
    console.log(
      "Expected output amount for swap:",
      expectedOutputAmount.toString(),
    );

    // Log balances before the swap
    const balanceCurrency0Before =
      await token0Contract.getCurrencyBalanceOf(walletAddress);
    const balanceCurrency1Before =
      await token1Contract.getCurrencyBalanceOf(walletAddress);
    console.log(
      "Balance of currency0 before swap:",
      balanceCurrency0Before.toString(),
    );
    console.log(
      "Balance of currency1 before swap:",
      balanceCurrency1Before.toString(),
    );

    // Execute the swap
    console.log("Executing swap...");

    // Send currency0 to the pair contract
    const hash2 = await wallet.sendMessage({
      to: routerAddress,
      feeCredit: BigInt(10_000_000),
      value: BigInt(0),
      data: encodeFunctionData({
        abi: routerArtifact.abi,
        functionName: "swap",
        args: [walletAddress, pairAddress, 0, expectedOutputAmount],
      }),
      refundTo: wallet.address,
      tokens: [
        {
          id: token0Address,
          amount: BigInt(swapAmount),
        },
      ],
    });

    await waitTillCompleted(publicClient, shardNumber(walletAddress), hash2);

    console.log(
      `Sent ${swapAmount.toString()} of currency0 to the pair contract. Tx - ${hash2}`,
    );

    console.log("Swap executed successfully.");

    // Log balances after the swap
    const balanceCurrency0After =
      await token0Contract.getCurrencyBalanceOf(walletAddress);
    const balanceCurrency1After =
      await token1Contract.getCurrencyBalanceOf(walletAddress);
    console.log(
      "SWAP RESULT: Balance of currency0 after swap:",
      balanceCurrency0After.toString(),
    );
    console.log(
      "SWAP RESULT: Balance of currency1 after swap:",
      balanceCurrency1After.toString(),
    );

    // 5. ROUTER: REMOVE LIQUIDITY
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

    const lpAddress = await pair.getCurrencyId();
    const userLpBalance = await pair.getCurrencyBalanceOf(walletAddress);
    console.log("Total LP balance for user wallet:", userLpBalance.toString());
    // Execute burn
    console.log("Executing burn...");
    // Send LP tokens to the user wallet
    const hash3 = await wallet.sendMessage({
      // @ts-ignore
      to: routerAddress,
      feeCredit: BigInt(10_000_000),
      value: BigInt(0),
      data: encodeFunctionData({
        abi: routerArtifact.abi,
        functionName: "removeLiquidity",
        args: [pairAddress, walletAddress],
      }),
      refundTo: walletAddress,
      tokens: [
        {
          id: pairAddress,
          amount: BigInt(userLpBalance),
        },
      ],
    });

    await waitTillCompleted(publicClient, shardNumber(walletAddress), hash3);

    console.log("Burn executed.");

    // Log balances after burn
    const balanceToken0 = await token0Contract.getCurrencyBalanceOf(
      pairAddress.toLowerCase(),
    );
    const balanceToken1 = await token1Contract.getCurrencyBalanceOf(
      pairAddress.toLowerCase(),
    );
    console.log(
      "REMOVELIQUIDITY RESULT: Pair Balance token0 after burn:",
      balanceToken0.toString(),
    );
    console.log(
      "REMOVELIQUIDITY RESULT: Pair Balance token1 after burn:",
      balanceToken1.toString(),
    );

    userBalanceToken0 =
      await token0Contract.getCurrencyBalanceOf(walletAddress);
    userBalanceToken1 =
      await token1Contract.getCurrencyBalanceOf(walletAddress);
    console.log(
      "REMOVELIQUIDITY RESULT: User Balance token0 after burn:",
      userBalanceToken0.toString(),
    );
    console.log(
      "REMOVELIQUIDITY RESULT: User Balance token1 after burn:",
      userBalanceToken1.toString(),
    );

    // Fetch and log reserves after burn
    const reserves = await pair.getReserves();
    console.log(
      "REMOVELIQUIDITY RESULT: Reserves from pair after burn:",
      reserves[0].toString(),
      reserves[1].toString(),
    );
  },
);

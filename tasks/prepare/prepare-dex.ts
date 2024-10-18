import { shardNumber } from "@nilfoundation/hardhat-plugin/dist/utils/conversion";
import { waitTillCompleted } from "@nilfoundation/niljs";
import { task } from "hardhat/config";
import { encodeFunctionData } from "viem";
import { createClient } from "../util/client";
import { initCurrency } from "../util/currency-init";
import { mintCurrency, sendCurrency } from "../util/currencyUtils";
import { deployDex } from "../util/dex-deployment";
import { initPair } from "../util/pair-init";

task("prepare-dex", "Prepare DEX contract and set currency to wallets")
  .addParam("wallets")
  .setAction(async (taskArgs, hre) => {
    const walletAddress = process.env.WALLET_ADDR;
    if (!walletAddress) {
      throw new Error("WALLET_ADDR is not set in environment variables");
    }

    const mintAmount: number = 100000000;
    const mintCurrency0Amount = 100000;
    const mintCurrency1Amount = 100000;
    const wallets = taskArgs.wallets.split(",") as string[];

    const { wallet, publicClient, signer } = await createClient();

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
    await mintCurrency({
      publicClient,
      signer,
      contractAddress: token0Address,
      walletAddress,
      mintAmount,
      hre,
    });

    // Mint and send Currency1
    console.log(
      `Minting ${mintAmount} Currency1 to wallet ${walletAddress}...`,
    );
    await mintCurrency({
      publicClient,
      signer,
      contractAddress: token1Address,
      walletAddress,
      mintAmount,
      hre,
    });

    for (const receiver of wallets) {
      const amount = mintAmount / 10;
      await sendCurrency({
        publicClient,
        signer,
        currencyContract: token0Contract,
        contractAddress: token0Address,
        walletAddress: receiver,
        mintAmount: amount,
        hre,
      });
      await sendCurrency({
        publicClient,
        signer,
        currencyContract: token1Contract,
        contractAddress: token1Address,
        walletAddress: receiver,
        mintAmount: amount,
        hre,
      });
    }

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
          id: token0Id,
          amount: BigInt(mintCurrency0Amount),
        },
        {
          id: token1Id,
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
  });

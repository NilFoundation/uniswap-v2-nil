import {createClient} from "../tasks/util/client";
import {deployNilContract} from "../tasks/util/deploy";
import type {Currency, UniswapV2Factory, UniswapV2Pair} from "../typechain-types";
import {faucetWithdrawal, mintAndSendCurrency, sleep} from "../tasks/util/currencyUtils";
import {encodeFunctionData} from "viem";
import {waitTillCompleted} from "@nilfoundation/niljs";
import {shardNumber} from "@nilfoundation/hardhat-plugin/dist/utils/conversion";
import {calculateOutputAmount} from "../tasks/util/math";

const hre = require("hardhat");
const { expect } = require("chai");

describe("Uniswap with Router (Sync)", async function  ()  {

  const walletAddress = process.env.WALLET_ADDR;
  if (!walletAddress) {
    throw new Error("WALLET_ADDR is not set in environment variables");
  }

  const faucetAddress = process.env.FAUCET_ADDR;

  const shardId = 1;
  const mintAmount = 100000;
  const mintCurrency0Amount = 10000;
  const mintCurrency1Amount = 10000;
  const swapAmount = 1000;

  let routerAddress: string;
  let RouterContract: any;
  let pairAddress: string;
  let firstCurrency: any;
  let secondCurrency: any;
  let pair: any;
  let reserve0: any;
  let reserve1: any;

  // DEPLOYMENT
  const { wallet, publicClient, signer } = await createClient();

  before(async function () {
    this.timeout(120000);

    const { deployedContract: factoryContract, contractAddress: factoryAddress } =
      await deployNilContract(hre, "UniswapV2Factory", [walletAddress]);
    const {
      deployedContract: Currency0Contract,
      contractAddress: currency0Address,
    } = await deployNilContract(hre, "Currency", [
      "currency0",
      await signer.getPublicKey(),
    ]);
    const {
      deployedContract: Currency1Contract,
      contractAddress: currency1Address,
    } = await deployNilContract(hre, "Currency", [
      "currency1",
      await signer.getPublicKey(),
    ]);

    console.log("Factory deployed " + factoryAddress);
    console.log("Currency0 deployed " + currency0Address);
    console.log("Currency1 deployed " + currency1Address);

    ({ deployedContract: RouterContract, contractAddress: routerAddress } =
      await deployNilContract(hre, "UniswapV2Router01"));

    console.log("Router deployed " + routerAddress);

    const factory = factoryContract as UniswapV2Factory;

    // 1. CREATE PAIR
    await factory.createPair(
      currency0Address.toLowerCase(),
      currency1Address.toLowerCase(),
      Math.floor(Math.random() * 10000000),
      shardId,
    );

    pairAddress = await factory.getTokenPair(
      currency0Address.toLowerCase(),
      currency1Address.toLowerCase(),
    );

    // Log the pair address
    console.log(`Pair created successfully at address: ${pairAddress}`);

    // Attach to the Currency contract for both currencies

    firstCurrency = Currency0Contract as Currency;
    const firstCurrencyId = await firstCurrency.getCurrencyId();
    console.log(`First currency ID: ${firstCurrencyId}`);

    secondCurrency = Currency1Contract as Currency;
    const secondCurrencyId = await secondCurrency.getCurrencyId();
    console.log(`Second currency ID: ${secondCurrencyId}`);

    // Attach to the newly created Uniswap V2 Pair contract
    const pairContract = await hre.ethers.getContractFactory("UniswapV2Pair");
    pair = pairContract.attach(pairAddress) as UniswapV2Pair;

    // Initialize the pair with currency addresses and IDs
    await pair.initialize(
      currency0Address.toLowerCase(),
      currency1Address.toLowerCase(),
      firstCurrencyId,
      secondCurrencyId,
    );

    console.log(`Pair initialized successfully at address: ${pairAddress}`);

    // Prepare currencies
    await faucetWithdrawal(
      currency0Address.toLowerCase(),
      100000000000n,
      faucetAddress,
      hre,
      publicClient,
    );

    await sleep(2000);

    await faucetWithdrawal(
      currency1Address.toLowerCase(),
      100000000000n,
      faucetAddress,
      hre,
      publicClient,
    );

    await sleep(2000);

    // 2. MINT CURRENCIES
    console.log(`Minting ${mintAmount} Currency0 to wallet ${walletAddress}...`);
    await mintAndSendCurrency({
      publicClient,
      signer,
      currencyContract: firstCurrency,
      contractAddress: currency0Address.toLowerCase(),
      walletAddress,
      mintAmount,
      hre,
    });

    // Mint and send Currency1
    console.log(`Minting ${mintAmount} Currency1 to wallet ${walletAddress}...`);
    await mintAndSendCurrency({
      publicClient,
      signer,
      currencyContract: secondCurrency,
      contractAddress: currency1Address.toLowerCase(),
      walletAddress,
      mintAmount,
      hre,
    });

    // Verify the balance of the recipient wallet for both currencies
    const recipientBalanceCurrency0 =
      await firstCurrency.getCurrencyBalanceOf(walletAddress);
    const recipientBalanceCurrency1 =
      await secondCurrency.getCurrencyBalanceOf(walletAddress);

    console.log(
      `Recipient balance after transfer - Currency0: ${recipientBalanceCurrency0}, Currency1: ${recipientBalanceCurrency1}`,
    );
  });

  it("Add liquidity", async function () {
    // Mint liquidity
    const routerArtifact = await hre.artifacts.readArtifact("UniswapV2Router01");
    console.log("Adding liquidity...");

    const hash = await wallet.sendMessage({
      to: routerAddress,
      feeCredit: BigInt(10_000_000),
      value: BigInt(0),
      refundTo: wallet.address,
      data: encodeFunctionData({
        abi: routerArtifact.abi,
        functionName: "addLiquiditySync",
        args: [
          pairAddress,
          walletAddress,
          mintCurrency0Amount,
          mintCurrency1Amount,
          1,
          1,
        ],
      }),
      tokens: [
        {
          id: await firstCurrency.getCurrencyId(),
          amount: BigInt(mintCurrency0Amount),
        },
        {
          id: await secondCurrency.getCurrencyId(),
          amount: BigInt(mintCurrency1Amount),
        },
      ],
    });

    await waitTillCompleted(publicClient, shardNumber(walletAddress), hash);

    console.log("Liquidity added...");

    // Retrieve and log reserves from the pair
    [reserve0, reserve1] = await pair.getReserves();
    expect(reserve0).eq(10000)
    expect(reserve1).eq(10000)

    // Check and log liquidity provider balance
    const lpBalance = await pair.getCurrencyBalanceOf(walletAddress);
    expect(lpBalance).eq(9000)
    const totalSupply = await pair.getCurrencyTotalSupply();
    expect(totalSupply).eq(18000)
  });

  it("Swap", async function () {
    const routerArtifact = await hre.artifacts.readArtifact("UniswapV2Router01");
    const expectedOutputAmount = calculateOutputAmount(
      BigInt(swapAmount),
      reserve0,
      reserve1,
    );
    console.log(
      "Expected output amount for swap:",
      expectedOutputAmount.toString(),
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
        functionName: "swapExactTokenForTokenSync",
        args: [pairAddress, 1, walletAddress],
      }),
      refundTo: wallet.address,
      tokens: [
        {
          id: await firstCurrency.getCurrencyId(),
          amount: BigInt(swapAmount),
        },
      ],
    });

    await waitTillCompleted(publicClient, shardNumber(walletAddress), hash2);

    console.log("Swap executed successfully.");

    // Log balances after the swap
    const balanceCurrency0After =
      await firstCurrency.getCurrencyBalanceOf(walletAddress);
    const balanceCurrency1After =
      await secondCurrency.getCurrencyBalanceOf(walletAddress);
    expect(balanceCurrency0After).eq(89000);
    expect(balanceCurrency1After).eq(90906);
  });

  it("Remove Liquidity", async function () {
    const routerArtifact = await hre.artifacts.readArtifact("UniswapV2Router01");
    const total = await pair.getCurrencyTotalSupply();
    console.log("Total supply:", total.toString());

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
        functionName: "removeLiquiditySync",
        args: [pairAddress, walletAddress, 100, 100],
      }),
      refundTo: walletAddress,
      tokens: [
        {
          id: lpAddress,
          amount: BigInt(userLpBalance),
        },
      ],
    });

    await waitTillCompleted(publicClient, shardNumber(walletAddress), hash3);

    console.log("Burn executed.");

    const userBalanceToken0 = await firstCurrency.getCurrencyBalanceOf(walletAddress);
    const userBalanceToken1 = await secondCurrency.getCurrencyBalanceOf(walletAddress);
    expect(userBalanceToken0).eq(94500)
    expect(userBalanceToken1).eq(95453)

    // Fetch and log reserves after burn
    const reserves = await pair.getReserves();
    expect(reserves[0]).eq(5500)
    expect(reserves[1]).eq(4547)
  });
});

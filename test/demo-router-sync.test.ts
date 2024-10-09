import {createClient} from "../tasks/util/client";
import {mintAndSendCurrency} from "../tasks/util/currencyUtils";
import {encodeFunctionData} from "viem";
import {waitTillCompleted} from "@nilfoundation/niljs";
import {shardNumber} from "@nilfoundation/hardhat-plugin/dist/utils/conversion";
import {calculateOutputAmount} from "../tasks/util/math";
import {deployDex} from "../tasks/util/dex-deployment";
import {initCurrency} from "../tasks/util/currency-init";
import {initPair} from "../tasks/util/pair-init";

const hre = require("hardhat");
const { expect } = require("chai");

describe("Uniswap with Router (Sync)", async function  ()  {

  const walletAddress = process.env.WALLET_ADDR;
  if (!walletAddress) {
    throw new Error("WALLET_ADDR is not set in environment variables");
  }

  const mintAmount = 100000;
  const mintCurrency0Amount = 10000;
  const mintCurrency1Amount = 10000;
  const swapAmount = 1000;

  let routerAddress: string;
  let RouterContract: any;
  let pairAddress: string;
  let token0Contract: any;
  let token1Contract: any;
  let token0Id: bigint;
  let token1Id: bigint;
  let token0Address: any;
  let token1Address: any;
  let pair: any;
  let reserve0: any;
  let reserve1: any;
  let factory: any;

  // DEPLOYMENT
  const { wallet, publicClient, signer } = await createClient();

  before(async function () {
    this.timeout(120000);

    const {wallet, publicClient} = await createClient();

    ({factory, routerAddress} = await deployDex(hre));
    console.log("Dex deployed, router - " + routerAddress);

    ({
      address: token0Address,
      currency: token0Contract,
      id: token0Id
    } = await initCurrency("Token0", mintAmount, hre));
    ({
      address: token1Address,
      currency: token1Contract,
      id: token1Id
    } = await initCurrency("Token1", mintAmount, hre));

    ({ address: pairAddress, pair} = await initPair(token0Address, token1Address, factory, hre));
    console.log("Pair deployed " + pairAddress);

    // 2. MINT CURRENCIES
    console.log(`Minting ${mintAmount} Currency0 to wallet ${walletAddress}...`);
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
    console.log(`Minting ${mintAmount} Currency1 to wallet ${walletAddress}...`);
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
  });

  it("Add liquidity", async function () {
    // Mint liquidity
    const routerArtifact = await hre.artifacts.readArtifact("UniswapV2Router01");
    console.log("Adding liquidity...");

    console.log("DEBUG " + [
      pairAddress,
      walletAddress,
      mintCurrency0Amount,
      mintCurrency1Amount,
      1,
      1,
    ]);

    console.log("DEBUG " + routerAddress + " " + wallet.address);

    console.log("DEBUG " + [
      {
        id: token0Id,
        amount: BigInt(mintCurrency0Amount),
      },
      {
        id: token1Id,
        amount: BigInt(mintCurrency1Amount),
      },
    ]);

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
          id: token0Id,
          amount: BigInt(swapAmount),
        },
      ],
    });

    await waitTillCompleted(publicClient, shardNumber(walletAddress), hash2);

    console.log("Swap executed successfully.");

    // Log balances after the swap
    const balanceCurrency0After =
      await token0Contract.getCurrencyBalanceOf(walletAddress);
    const balanceCurrency1After =
      await token1Contract.getCurrencyBalanceOf(walletAddress);
    expect(balanceCurrency0After).eq(189000);
    expect(balanceCurrency1After).eq(190906);
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

    const userBalanceToken0 = await token0Contract.getCurrencyBalanceOf(walletAddress);
    const userBalanceToken1 = await token1Contract.getCurrencyBalanceOf(walletAddress);
    expect(userBalanceToken0).eq(194500)
    expect(userBalanceToken1).eq(195453)

    // Fetch and log reserves after burn
    const reserves = await pair.getReserves();
    expect(reserves[0]).eq(5500)
    expect(reserves[1]).eq(4547)
  });
});

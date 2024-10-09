import type { HardhatRuntimeEnvironment } from "hardhat/types";
import type {
  Currency,
  UniswapV2Factory,
  UniswapV2Pair,
} from "../../typechain-types";

export async function initPair(
  token0: string,
  token1: string,
  factory: UniswapV2Factory,
  hre: HardhatRuntimeEnvironment,
  shardId = 1,
): Promise<PairInitResult> {
  const walletAddress = process.env.WALLET_ADDR;
  if (!walletAddress) {
    throw new Error("WALLET_ADDR is not set in environment variables");
  }

  await factory.createPair(
    token0,
    token1,
    Math.floor(Math.random() * 10000000),
    shardId,
  );
  const pairAddress = await factory.getTokenPair(
    token0.toLowerCase(),
    token1.toLowerCase(),
  );

  const pairContract = await hre.ethers.getContractFactory("UniswapV2Pair");
  const pair = pairContract.attach(pairAddress) as UniswapV2Pair;

  const currencyContract = await hre.ethers.getContractFactory("Currency");
  const token0Contract = currencyContract.attach(token0) as Currency;
  const token1Contract = currencyContract.attach(token1) as Currency;

  await pair.initialize(
    token0.toLowerCase(),
    token1.toLowerCase(),
    await token0Contract.getCurrencyId(),
    await token1Contract.getCurrencyId(),
  );

  return {
    pair,
    address: pairAddress,
  };
}

export interface PairInitResult {
  pair: UniswapV2Pair;
  address: string;
}

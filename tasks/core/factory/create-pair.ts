import { task } from "hardhat/config";
import type { UniswapV2Factory, Currency, UniswapV2Pair } from "../../../typechain-types";

task("deploy-pair", "Deploy and initialize a new Uniswap V2 pair")
.addParam("factory", "The address of the Uniswap V2 factory")
.addParam("currency0", "The address of the first currency")
.addParam("currency1", "The address of the second currency")
.setAction(async (taskArgs, hre) => {
  // Attach to the Uniswap V2 Factory contract
  const factoryContract = await hre.ethers.getContractFactory("UniswapV2Factory");
  const factory = factoryContract.attach(taskArgs.factory) as UniswapV2Factory;

  const shardId = 1;

  // Create the pair and get its address
  await factory.createPair(
      taskArgs.currency0.toLowerCase(),
      taskArgs.currency1.toLowerCase(),
      Math.floor(Math.random() * 10000000),
      shardId,
  );

  const pairAddress = await factory.getTokenPair(
      taskArgs.currency0.toLowerCase(),
      taskArgs.currency1.toLowerCase()
  );

  // Log the pair address
  console.log(`Pair created successfully at address: ${pairAddress}`);

  // Attach to the Currency contract for both currencies
  const currencyContract = await hre.ethers.getContractFactory("Currency");

  const firstCurrency = currencyContract.attach(taskArgs.currency0) as Currency;
  const firstCurrencyId = await firstCurrency.getCurrencyId();
  console.log(`First currency ID: ${firstCurrencyId}`);

  const secondCurrency = currencyContract.attach(taskArgs.currency1) as Currency;
  const secondCurrencyId = await secondCurrency.getCurrencyId();
  console.log(`Second currency ID: ${secondCurrencyId}`);

  // Attach to the newly created Uniswap V2 Pair contract
  const pairContract = await hre.ethers.getContractFactory("UniswapV2Pair");
  const pair = pairContract.attach(pairAddress) as UniswapV2Pair;

  // Initialize the pair with currency addresses and IDs
  await pair.initialize(
      taskArgs.currency0,
      taskArgs.currency1,
      firstCurrencyId,
      secondCurrencyId
  );

  console.log(`Pair initialized successfully at address: ${pairAddress}`);
});

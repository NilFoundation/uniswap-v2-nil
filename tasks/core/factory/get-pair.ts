import { task } from "hardhat/config";
import type { UniswapV2Factory } from "../../../typechain-types";

task("get-pair", "Retrieve the pair address for the specified currencies")
.addParam("factory", "The address of the Uniswap V2 factory")
.addParam("currency0", "The address of the first currency")
.addParam("currency1", "The address of the second currency")
.setAction(async (taskArgs, hre) => {
  // Attach to the Uniswap V2 Factory contract
  const factoryContract = await hre.ethers.getContractFactory("UniswapV2Factory");
  const factory = factoryContract.attach(taskArgs.factory) as UniswapV2Factory;

  // Retrieve the pair address
  const pairAddress = await factory.getTokenPair(
      taskArgs.currency0.toLowerCase(),
      taskArgs.currency1.toLowerCase()
  );

  // Log the pair address
  console.log(`Pair address: ${pairAddress}`);
});

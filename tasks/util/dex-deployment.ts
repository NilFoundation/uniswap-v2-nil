import {deployNilContract} from "./deploy";
import type {UniswapV2Factory, UniswapV2Router01} from "../../typechain-types";
import {HardhatRuntimeEnvironment} from "hardhat/types";

export async function deployDex(
  hre: HardhatRuntimeEnvironment,
): Promise<DexDeploymentResult> {
  const walletAddress = process.env.WALLET_ADDR;
  if (!walletAddress) {
    throw new Error("WALLET_ADDR is not set in environment variables");
  }

  const { deployedContract: factoryContract, contractAddress: factoryAddress } =
    await deployNilContract(hre, "UniswapV2Factory", [walletAddress]);

  console.log("Factory deployed " + factoryAddress);

  const { deployedContract: RouterContract, contractAddress: routerAddress } =
    await deployNilContract(hre, "UniswapV2Router01");

  console.log("Router deployed " + routerAddress);

  const factory = factoryContract as UniswapV2Factory;
  const router = RouterContract as UniswapV2Router01;

  return {
    factory,
    factoryAddress,
    router,
    routerAddress
  }
}

export interface DexDeploymentResult {
  factory: UniswapV2Factory;
  factoryAddress: string;
  router: UniswapV2Router01;
  routerAddress: string;
}

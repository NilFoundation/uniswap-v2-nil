import assert from "node:assert";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

export async function deployNilContract(
  hre: HardhatRuntimeEnvironment,
  name: string,
  args: unknown[] = [],
) {
  const factory = await hre.ethers.getContractFactory(name);
  assert.ok(factory.runner);
  assert.ok(factory.runner.sendTransaction);

  const deployTx = await factory.getDeployTransaction(...args);
  const sentTx = await factory.runner.sendTransaction(deployTx);
  console.log("deployTx:", sentTx.hash);
  const txReceipt = await sentTx.wait();

  if (!txReceipt || !txReceipt.contractAddress) {
    throw new Error("Contract deployment failed");
  }

  const deployedContract = factory.attach(txReceipt.contractAddress);
  return { deployedContract, contractAddress: txReceipt.contractAddress };
}

import {deployNilContract} from "./deploy";
import type {Currency} from "../../typechain-types";
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {faucetWithdrawal, mintAndSendCurrency, sleep} from "./currencyUtils";
import {createClient} from "./client";

export async function initCurrency(
  name: string,
  mintAmount: any,
  hre: HardhatRuntimeEnvironment,
): Promise<CurrencyResult> {
  const walletAddress = process.env.WALLET_ADDR;
  if (!walletAddress) {
    throw new Error("WALLET_ADDR is not set in environment variables");
  }
  const faucetAddress = process.env.FAUCET_ADDR;

  const { publicClient, signer } = await createClient();

  const {
    deployedContract: CurrencyContract,
    contractAddress: currencyAddress,
  } = await deployNilContract(hre, "Currency", [
    name,
    await signer.getPublicKey(),
  ]);

  await sleep(2000)

  // Prepare currencies
  await faucetWithdrawal(
    currencyAddress.toLowerCase(),
    100000000000n,
    faucetAddress,
    hre,
    publicClient,
  );

  await sleep(2000)

  console.log(`Minting ${mintAmount} ${name} to wallet ${walletAddress}...`);
  await mintAndSendCurrency({
    publicClient,
    signer,
    currencyContract: CurrencyContract,
    contractAddress: currencyAddress.toLowerCase(),
    walletAddress,
    mintAmount,
    hre,
  });

  const contract = CurrencyContract as Currency;

  return {
    address: currencyAddress.toLowerCase(),
    currency: contract,
    id: await contract.getCurrencyId()
  }
}

export interface CurrencyResult {
  address: string;
  currency: Currency;
  id: bigint,
}

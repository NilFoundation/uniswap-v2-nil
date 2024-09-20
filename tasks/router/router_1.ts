import {
  Faucet,
  HttpTransport,
  LocalECDSAKeySigner,
  PublicClient,
  WalletV1,
  generateRandomPrivateKey,
} from "@nilfoundation/niljs";
import { task } from "hardhat/config";
import { encodeFunctionData } from "viem";
import {
  Token,
  UniswapV2Factory,
  UniswapV2Pair,
  UniswapV2Router01,
} from "../../typechain-types";

task("router_1", "Router: init and add liquidity")
  .addParam("token0")
  .addParam("token1")
  .addParam("router")
  .addParam("factory")
  .setAction(async (taskArgs, hre) => {
    const walletAddress = process.env.WALLET_ADDR;

    if (!walletAddress) {
      throw new Error("WALLET_ADDR is not set in environment variables");
    }

    const client = new PublicClient({
      transport: new HttpTransport({
        endpoint: "http://127.0.0.1:8529",
      }),
      shardId: 1,
    });

    const faucet = new Faucet(client);

    const signer = new LocalECDSAKeySigner({
      privateKey: `0x${process.env.PRIVATE_KEY}`,
    });

    const pubkey = await signer.getPublicKey();

    const wallet = new WalletV1({
      pubkey: pubkey,
      salt: BigInt(Math.round(Math.random() * 10000)),
      shardId: 1,
      client,
      signer,
    });

    const token0Address = taskArgs.token0.toLowerCase();
    const token1Address = taskArgs.token1.toLowerCase();
    const factoryAddress = taskArgs.factory.toLowerCase();
    const routerAddress = taskArgs.router.toLowerCase();

    const UniswapV2Router =
      await hre.ethers.getContractFactory("UniswapV2Router01");
    const router = UniswapV2Router.attach(factoryAddress) as UniswapV2Router01;

    wallet.sendMessage({
      to: walletAddress,
      feeCredit: 1_000_000n * 10n,
      value: 0n,
      data: encodeFunctionData({
        abi: UniswapV2Router01.abi,
        functionName: "setCurrencyName",
        args: ["MY_TOKEN"],
      }),
    });

    // TODO
  });

import {
  HttpTransport,
  LocalECDSAKeySigner,
  PublicClient,
  WalletV1,
} from "@nilfoundation/niljs";

export async function createClient(): Promise<{
  wallet: WalletV1;
  publicClient: PublicClient;
}> {
  const walletAddress = process.env.WALLET_ADDR;

  if (!walletAddress) {
    throw new Error("WALLET_ADDR is not set in environment variables");
  }

  const url = process.env.NIL_RPC_ENDPOINT;

  if (!url) {
    throw new Error("NIL_RPC_ENDPOINT is not set in environment variables");
  }

  const publicClient = new PublicClient({
    transport: new HttpTransport({
      endpoint: url,
    }),
    shardId: 1,
  });

  const signer = new LocalECDSAKeySigner({
    privateKey: `0x${process.env.PRIVATE_KEY}`,
  });
  const pubkey = await signer.getPublicKey();

  const wallet = new WalletV1({
    pubkey: pubkey,
    address: walletAddress,
    client: publicClient,
    signer,
  });

  return { wallet, publicClient };
}

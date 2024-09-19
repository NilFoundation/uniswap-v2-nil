import {HttpTransport, LocalECDSAKeySigner, PublicClient, WalletV1} from "@nilfoundation/niljs";

export async function client(): Promise<WalletV1> {
    const publicClient = new PublicClient({
        transport: new HttpTransport({
            endpoint: process.env.NIL_RPC_ENDPOINT!,
        }),
        shardId: 1,
    });

    const signer = new LocalECDSAKeySigner({
        privateKey: `0x${process.env.PRIVATE_KEY}`,
    });
    const pubkey = await signer.getPublicKey();

    return new WalletV1({
        pubkey: pubkey,
        address: process.env.WALLET_ADDR!,
        // salt: BigInt(Math.round(Math.random() * 10000)),
        // shardId: 1,
        client: publicClient,
        signer,
    });
}
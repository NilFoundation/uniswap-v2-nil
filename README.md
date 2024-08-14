
# Uniswap V2 =nil;

## Overview

This repository is an example repo to showcase how to migrate dApps from Ethereum-like networks to =nil;. Uniswap V2 serves as a great base to demonstrate the following:

1. How to work with =nil; multi-currencies.
2. How to utilize async calls.
3. How to distribute load to multiple shards.

## How to run

1) Clone the Nil repo and run a node. Instructions can be found [here](https://github.com/NilFoundation/nil).

```shell
git clone https://github.com/NilFoundation/nil
cd nil
git checkout a3a99e1
```

2) Configure the node and create a new wallet:

```shell
./build/bin/nil_cli config init
./build/bin/nil_cli config set rpc_endpoint NIL_ENDPOINT
./build/bin/nil_cli keygen new
./build/bin/nil_cli wallet new
```

3) Create a `.env` file in the root of the project with the following configuration:

```bash
NIL_RPC_ENDPOINT=http://127.0.0.1:8529
WALLET_ADDR=0x0001111111111111111111111111111111111111
PRIVATE_KEY=<your_private_key_here>
```

Ensure to replace `<your_private_key_here>` with the actual private key without the `0x` prefix.

4) Deploy the contracts:

Run the deployment command twice due to a known issue with deploying two contracts in the same script:

```shell
npx hardhat ignition deploy ./ignition/modules/amm.ts --network nil
```

5) Execute commands such as `swap`, `info`, `sync`, `skim`, and `burn` using the appropriate pair and library addresses.

## Project Phases

1. Deploy Uniswap V2 pair and factory contract to a single shard with mock tokens.
2. Replace mock tokens with Nil multicurrency.
3. Design the architecture to utilize shards.

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](./LICENSE) file for more details. Portions of this project are derived from [Uniswap V2](https://github.com/Uniswap/v2-core) and are also subject to the GPL-3.0 License.


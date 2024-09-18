
# Uniswap V2 =nil;

## Overview

This repository is an example repo to showcase how to migrate dApps from Ethereum-like networks to =nil;. Uniswap V2 serves as a great base to demonstrate the following:

1. How to work with =nil; multi-currencies.
2. How to utilize async calls.
3. How to distribute load to multiple shards.

## How to setup

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

4) Enable debug logs. In `hardhat.config.ts` set `debug: true`.
For now you can't see deployed contract addresses directly from hardhat results.


## How to use

1) First you need to deploy token contracts and factory(or use existing ones).
In case of deployment new contracts please copy them from the debug logs.

```shell
npx hardhat flow_1 --network nil 
```

Deployment log example
```
Response deployment {"hash":"0x0b788324e101a972c383d0a8ecd58084921d3ac84869b761c643317728eaf66d","address":"0x0001fd2e170eec3b3b538183c4d749adca5065b1"}
```

2) Run flow to check DEX flows. This task will init a pair contract(or fetch the existed).
Then it mint pair tokens and run swap
```shell
npx hardhat flow_2 --network nil --token0 <token0address> --token1 <token1address> --toburn <burnaddress> --factory <factoryaddress>
```

## Current Issues

1. Deployed contract address can be fetched only from debug logs
2. No chained swaps support
3. Security: no router contract to send tokens and call pair message in single transaction.

## License

This project is licensed under the GPL-3.0 License. See the [LICENSE](./LICENSE) file for more details. Portions of this project are derived from [Uniswap V2](https://github.com/Uniswap/v2-core) and are also subject to the GPL-3.0 License.


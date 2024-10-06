
# Uniswap V2 =nil;

## Overview

This repository is an example repo to showcase how to migrate dApps from Ethereum-like networks to =nil;.
Uniswap V2 serves as a great base to demonstrate the following:

1. How to work with =nil; multi-currencies.
2. How to utilize async calls.
3. How to distribute load to multiple shards.

## How to setup

1) Clone the Nil repo and run a node. Instructions can be found [here](https://github.com/NilFoundation/nil).

```shell
git clone https://github.com/NilFoundation/nil
```

2) Configure the node and create a new wallet:

```shell
./build/bin/nil config init
./build/bin/nil config set rpc_endpoint NIL_ENDPOINT
./build/bin/nil keygen new
./build/bin/nil wallet new
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

## How to Use

### 1. Run Demo with Direct Messages to the Pair Contract
This demo task demonstrates how to create a `UniswapV2Pair` for two currencies,
add liquidity to the LP, perform swaps, and remove liquidity by directly calling `UniswapV2Pair`.

```shell
npx hardhat demo --network nil 
```

#### Important:
- The `UniswapV2Pair` is deployed on the same shard as the `UniswapV2Factory`.
- Calculations are processed on the user's side.
- Both the currency address and its ID are stored.

### 2. Run Demo with Async Router Calls
This demo task shows how to deploy the `UniswapV2Router01` contract
and use it as a proxy for adding/removing liquidity and performing swaps.
Async calls are used, meaning `UniswapV2Router01` can be deployed on a different shard than the core contracts.

```shell
npx hardhat demo-router --network nil 
```

#### Important:
- The `UniswapV2Factory` is used for creating new pairs. `UniswapV2Router01` calls already deployed pair contracts.
- `UniswapV2Router01` can be deployed on a different shard.
- Vulnerability: no checks are performed during adding/removing liquidity and swaps.
Rates and output amounts are entirely calculated on the user side.

### 3. Run Demo with Sync Router Calls (1 Shard)
This demo task shows how to deploy the `UniswapV2Router01` contract
and use it as a proxy for adding/removing liquidity and swaps via sync calls.
It allows checks on amounts before pair calls and maintains currency rates.

```shell
npx hardhat demo-router-sync --network nil 
```

#### Important:
- `UniswapV2Router01` should be deployed on the same shard as the pair contract.
- It maintains the currency exchange rate when adding/removing liquidity.
- It supports limit checks for currency amounts.

## Current Issues

1. Use Nil.js wallet to attach tokens to the transaction message.
2. No support for chained swaps on the Nil network.
3. Fee collection is not implemented.

## License

This project is licensed under the GPL-3.0 License.
See the [LICENSE](./LICENSE) file for more details. Portions of this project
are derived from [Uniswap V2](https://github.com/Uniswap/v2-core) and are also subject to the GPL-3.0 License.

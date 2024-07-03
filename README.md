# Uniswap-v2 with nil token mock library

This is a uni-v2 implementation with a mock token library. The mock token library is a simple ERC20-like token imlementation that uses one contract to handle all tokens. Later it will be replaced with a real the protocol level token implementation

## How to run

1) First, you need to clone the nil repo to run a node, you can check hot to run a node [here](https://github.com/NilFoundation/nil)
```shell
git clone https://github.com/NilFoundation/nil
cd nil
```

2) Configure the node and create a new wallet
```shell
./build/bin/nil_cli config init
./build/bin/nil_cli config set rpc_endpoint NIL_ENDPOINT
./build/bin/nil_cli keygen new
```

3) Create a `.env` File:
Create a file named `.env` in the root of the project and add the following configurations:

```bash
NIL_RPC_ENDPOINT=http://127.0.0.1:8529
WALLET_ADDR=0x0001111111111111111111111111111111111111
PRIVATE_KEY=<your_private_key_here>
```

Replace `<your_private_key_here>` with the private key you extracted earlier, ensuring you do not include the `0x` prefix.

4) Once the node is running, you can run the tests
```shell
npm run test
npm run deploy
```

5) Copy the factory address and run the swap command
```shell
npx hardhat swap --network nil_cluster --factory 0x0001cb94933e88FA114910413423E79B4d52116e
```

# Flow


Deploy token 
```shell
npx hardhat deploy_token --network nil
```

Deploy factory
```shell
npx hardhat deploy_factory --network nil --owner 0x0001ef10c1c0bbc80e75272e85af882d724bdc15
```

Mint token
```shell
npx hardhat mint_token --network nil --token ...
```

Deploy pair
```shell
npx hardhat deploy_pair --network nil --token0 0x0001c467d4a788a5442c15b8ff47bf8b4e69be95 --token1 0x0001fe7727c76fb68a96bd7952f762ecb172b3c8 --factory 0x00010dd2c77d4e0c9172f1c5635caa240c95eb94
```

Get pair
```shell
npx hardhat get_pair --network nil --token0 0x0001c467d4a788a5442c15b8ff47bf8b4e69be95 --token1 0x0001fe7727c76fb68a96bd7952f762ecb172b3c8 --factory 0x00010dd2c77d4e0c9172f1c5635caa240c95eb94
```

Init pair
```shell
npx hardhat initialize --network nil --token0 0x0001c467d4a788a5442c15b8ff47bf8b4e69be95 --token1 0x0001fe7727c76fb68a96bd7952f762ecb172b3c8 --pair 0x0001fD03948132a17CC8E8B1590299BaF48A02aD --supply 100
```

# Issues

- Impossible to send multicurrency tokens to zero or dead addresses



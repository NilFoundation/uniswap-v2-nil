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
npx hardhat deploy_pair --network nil --token0 0x0001498110e9f756136c0a1f13f392c113d61162 --token1 0x00017a4161f1bb2718ff078b53da594a858f33c5 --factory 0x0001199d780ab5f4fa4cfe7866f2505b6b9d08d3
```

Get pair
```shell
npx hardhat get_pair --network nil --token0 0x0001498110e9f756136c0a1f13f392c113d61162 --token1 0x00017a4161f1bb2718ff078b53da594a858f33c5 --factory 0x0001199d780ab5f4fa4cfe7866f2505b6b9d08d3
```

Init pair
```shell
npx hardhat initialize --network nil --token0 0x0001498110e9f756136c0a1f13f392c113d61162 --token1 0x00017a4161f1bb2718ff078b53da594a858f33c5 --pair 0x000158DB8b271EDC62174d661428fC44E7973dED --supply 100
```

# Issues

- Impossible to send multicurrency tokens to zero or dead addresses


USDT
USDC

100000010 1000001 -> 1000 1/1
110 91 -> 1000 1.1/92
100 100 -> 1000 1/1



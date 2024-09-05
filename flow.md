# flow


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
npx hardhat deploy_pair --network nil --token0 0x0001fedf8579f598e0d187a732406398140d11e1 --token1 0x00011cd49978ffb25bbeee6a6048e0cf6a75cf60 --factory 0x000112c0ded13e8f4478c963924c900722a69b40
```

Get pair
```shell
npx hardhat get_pair --network nil --token0 0x0001fedf8579f598e0d187a732406398140d11e1 --token1 0x00011cd49978ffb25bbeee6a6048e0cf6a75cf60 --factory 0x000112c0ded13e8f4478c963924c900722a69b40
```

Init pair
```shell
npx hardhat initialize --network nil --token0 0x0001fedf8579f598e0d187a732406398140d11e1 --token1 0x00011cd49978ffb25bbeee6a6048e0cf6a75cf60 --pair 0x000162185125DB14403426533dFf09CbAFc5a729 --supply 100
```
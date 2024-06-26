import { Contract, Wallet } from 'ethers'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { ethers } from 'hardhat'
import { TokenLibrary } from '../../typechain-types'

// interface FactoryFixture {
//   factory: Contract
// }

// const overrides = {
//   gasLimit: 9999999
// }

// export async function factoryFixture(_: Web3Provider, [wallet]: Wallet[]): Promise<FactoryFixture> {
//   const factory = await deployContract(wallet, UniswapV2Factory, [wallet.address], overrides)
//   return { factory }
// }

interface PairFixture extends FactoryFixture {
  token0: Contract
  token1: Contract
  pair: Contract
}

// export async function pairFixture(provider: Web3Provider, [wallet]: Wallet[]): Promise<PairFixture> {
//   const { factory } = await factoryFixture(provider, [wallet])

//   const tokenA = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)
//   const tokenB = await deployContract(wallet, ERC20, [expandTo18Decimals(10000)], overrides)

//   await factory.createPair(tokenA.address, tokenB.address, overrides)
//   const pairAddress = await factory.getPair(tokenA.address, tokenB.address)
//   const pair = new Contract(pairAddress, JSON.stringify(UniswapV2Pair.abi), provider).connect(wallet)

//   const token0Address = (await pair.token0()).address
//   const token0 = tokenA.address === token0Address ? tokenA : tokenB
//   const token1 = tokenA.address === token0Address ? tokenB : tokenA

//   return { factory, token0, token1, pair }
// }




export async function deploy(deployer: SignerWithAddress, tokenContract: TokenLibrary) {
  const totalSupply = ethers.parseEther("100");

  await tokenContract.newToken(
    "TestToken0",
    "TT0",
    18,
    totalSupply,
    await deployer.getAddress()
  );

  await tokenContract.newToken(
    "TestToken1",
    "TT1",
    18,
    totalSupply,
    await deployer.getAddress()
  );

  const tokenCreatedFilter = tokenContract.filters.TokenCreated;
  const events = await tokenContract.queryFilter(tokenCreatedFilter, 'latest');

  const token0Address = events[0].args[0];
  const token1Address = events[1].args[0];


  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  const factory = await Factory.deploy(ethers.ZeroAddress);

  console.log(token0Address);
  console.log(token1Address);

}

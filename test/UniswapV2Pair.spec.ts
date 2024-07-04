import { expect } from 'chai'
import { ethers } from 'hardhat';
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers"
import { TokenLibrary, UniswapV2Factory, UniswapV2Pair } from '../typechain-types';
import { time } from '@nomicfoundation/hardhat-toolbox/network-helpers';

const MINIMUM_LIQUIDITY = 1000n;
const AddressZero = ethers.ZeroAddress;


describe('UniswapV2Pair', () => {

  let tokenContract: TokenLibrary;
  let factory: UniswapV2Factory;
  let token0: string;
  let token1: string;

  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let pair: UniswapV2Pair;
  let pairTokenAddress: string;

  async function deploy() {
    const [alice, bob] = await ethers.getSigners();
    const totalSupply = ethers.parseEther("10000");

    const TokenLibrary = await ethers.getContractFactory("TokenLibrary");
    tokenContract = await TokenLibrary.deploy();

    let blk = await time.latestBlock();

    await tokenContract.newToken(
      "TestToken0",
      "TT0",
      18,
      totalSupply,
      await alice.getAddress()
    );

    await tokenContract.newToken(
      "TestToken1",
      "TT1",
      18,
      totalSupply,
      await alice.getAddress()
    );

    const tokenCreatedFilter = tokenContract.filters.TokenCreated;
    let events = await tokenContract.queryFilter(tokenCreatedFilter, blk);

    token1 = events[0].args[0];
    token0 = events[1].args[0];

    const Factory = await ethers.getContractFactory("UniswapV2Factory");
    factory = await Factory.deploy(await tokenContract.getAddress(), await tokenContract.getAddress());

    await factory.createPair(token0, token1);
    const pairCreatedFilter = factory.filters.PairCreated;

    blk = await time.latestBlock();
    events = await factory.queryFilter(pairCreatedFilter, blk);
    const pairAddress = events[0].args?.[2]

    pair = await ethers.getContractAt("UniswapV2Pair", pairAddress);

    events = await tokenContract.queryFilter(tokenCreatedFilter, blk);
    pairTokenAddress = events[0].args?.[0];
  }

  beforeEach(async () => {
    [alice, bob] = await ethers.getSigners();
    await loadFixture(deploy);
  })

  it('mint', async () => {
    const token0Amount = ethers.parseEther('1');
    const token1Amount = ethers.parseEther('4');
    await tokenContract.transfer(token0, await pair.getAddress(), token0Amount)
    await tokenContract.transfer(token1, await pair.getAddress(), token1Amount)

    const expectedLiquidity = ethers.parseEther('2');

    await expect(pair.mint(alice.address))
      .to.emit(tokenContract, 'Transfer')
      .withArgs(AddressZero, AddressZero, MINIMUM_LIQUIDITY)
      .to.emit(tokenContract, 'Transfer')
      .withArgs(AddressZero, alice.address, expectedLiquidity - (MINIMUM_LIQUIDITY))
      .to.emit(pair, 'Sync')
      .withArgs(token0Amount, token1Amount)
      .to.emit(pair, 'Mint')
      .withArgs(alice.address, token0Amount, token1Amount)

    const token = await tokenContract.tokens(pairTokenAddress);

    expect((await tokenContract.tokens(pairTokenAddress)).totalSupply).to.eq(expectedLiquidity)
    expect(await tokenContract.balanceOf(pairTokenAddress, alice.address)).to.eq(expectedLiquidity - (MINIMUM_LIQUIDITY))
    expect(await tokenContract.balanceOf(token0, await pair.getAddress())).to.eq(token0Amount)
    expect(await tokenContract.balanceOf(token1, await pair.getAddress())).to.eq(token1Amount)
    const reserves = await pair.getReserves()
    expect(reserves[0]).to.eq(token0Amount)
    expect(reserves[1]).to.eq(token1Amount)
  })

  async function addLiquidity(token0Amount: bigint, token1Amount: bigint) {
    await tokenContract.transfer(token0, await pair.getAddress(), token0Amount)
    await tokenContract.transfer(token1, await pair.getAddress(), token1Amount)
    await pair.mint(alice.address)
  }

  it('addsLiquidity', async () => {
    const swapTestCases: bigint[][] = [
      [1, 5, 10, '1662497915624478906'],
      [1, 10, 5, '453305446940074565'],
      [2, 5, 10, '2851015155847869602'],
      [2, 10, 5, '831248957812239453'],
      [1, 10, 10, '906610893880149131'],
      [1, 100, 100, '987158034397061298'],
      [1, 1000, 1000, '996006981039903216']
    ].map(a => a.map(n => (typeof n === 'string' ? BigInt(n) : ethers.parseEther(n.toString()))))
    swapTestCases.forEach((swapTestCase, i) => {
      it(`getInputPrice:${i}`, async () => {
        const [swapAmount, token0Amount, token1Amount, expectedOutputAmount] = swapTestCase
        await addLiquidity(token0Amount, token1Amount);

        await tokenContract.transfer(token0, await pair.getAddress(), swapAmount);

        await expect(pair.swap(0, expectedOutputAmount + BigInt(1), alice.address, '0x')).to.be.revertedWith(
          'UniswapV2: K'
        );

        await pair.swap(0, expectedOutputAmount, alice.address, '0x');
      })
    })
  })

  it('addsLiquidity optimistically', async () => {
    const optimisticTestCases: BigNumber[][] = [
      ['997000000000000000', 5, 10, 1], // given amountIn, amountOut = floor(amountIn * .997)
      ['997000000000000000', 10, 5, 1],
      ['997000000000000000', 5, 5, 1],
      [1, 5, 5, '1003009027081243732'] // given amountOut, amountIn = ceiling(amountOut / .997)
    ].map(a => a.map(n => (typeof n === 'string' ? BigInt(n) : ethers.parseEther(n.toString()))))
    optimisticTestCases.forEach((optimisticTestCase, i) => {
      it(`optimistic:${i}`, async () => {
        const [outputAmount, token0Amount, token1Amount, inputAmount] = optimisticTestCase
        await addLiquidity(token0Amount, token1Amount)
        await tokenContract.transfer(token0, await pair.getAddress(), inputAmount)
        await expect(pair.swap(outputAmount.add(1), 0, alice.address, '0x')).to.be.revertedWith(
          'UniswapV2: K'
        )
        await pair.swap(outputAmount, 0, alice.address, '0x')
      })
    })
  })

  it('swap:token0', async () => {
    const token0Amount = ethers.parseEther("5");
    const token1Amount = ethers.parseEther("10");
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = ethers.parseEther("1")
    const expectedOutputAmount = BigInt('1662497915624478906')

    await tokenContract.transfer(token0, await pair.getAddress(), swapAmount)

    await expect(pair.swap(0, expectedOutputAmount, alice.address, '0x'))
      .to.emit(tokenContract, 'Transfer')
      .withArgs(await pair.getAddress(), alice.address, expectedOutputAmount)
      .to.emit(pair, 'Sync')
      .withArgs(token0Amount + (swapAmount), token1Amount - (expectedOutputAmount))
      .to.emit(pair, 'Swap')
      .withArgs(alice.address, swapAmount, 0, 0, expectedOutputAmount, alice.address)

    const reserves = await pair.getReserves()
    expect(reserves[0]).to.eq(token0Amount + (swapAmount))
    expect(reserves[1]).to.eq(token1Amount - (expectedOutputAmount))

    expect(await tokenContract.balanceOf(token0, await pair.getAddress())).to.eq(token0Amount + (swapAmount))
    expect(await tokenContract.balanceOf(token1, await pair.getAddress())).to.eq(token1Amount - (expectedOutputAmount))

    const totalSupplyToken0 = (await tokenContract.tokens(token0))[3];
    const totalSupplyToken1 = (await tokenContract.tokens(token1))[3];

    expect(await tokenContract.balanceOf(token0, alice.address)).to.eq((totalSupplyToken0 - token0Amount - swapAmount) - totalSupplyToken0 / 2n)
    expect(await tokenContract.balanceOf(token1, alice.address)).to.eq((totalSupplyToken1 - token1Amount + expectedOutputAmount) - totalSupplyToken1 / 2n)
  })

  it('swap:token1', async () => {
    const token0Amount = ethers.parseEther("5");
    const token1Amount = ethers.parseEther("10");
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = ethers.parseEther("1");
    const expectedOutputAmount = BigInt('453305446940074565')

    await tokenContract.transfer(token1, await pair.getAddress(), swapAmount)

    await expect(pair.swap(expectedOutputAmount, 0, alice.address, '0x'))
      .to.emit(tokenContract, 'Transfer')
      .withArgs(await pair.getAddress(), alice.address, expectedOutputAmount)
      .to.emit(pair, 'Sync')
      .withArgs((token0Amount - expectedOutputAmount), token1Amount + swapAmount)
      .to.emit(pair, 'Swap')
      .withArgs(alice.address, 0, swapAmount, expectedOutputAmount, 0, alice.address)

    const reserves = await pair.getReserves()
    expect(reserves[0]).to.eq(token0Amount - expectedOutputAmount)
    expect(reserves[1]).to.eq(token1Amount + swapAmount)
    expect(await tokenContract.balanceOf(token0, await pair.getAddress())).to.eq(token0Amount - (expectedOutputAmount))
    expect(await tokenContract.balanceOf(token1, await pair.getAddress())).to.eq(token1Amount + (swapAmount))

    const totalSupplyToken0 = (await tokenContract.tokens(token0))[3];
    const totalSupplyToken1 = (await tokenContract.tokens(token1))[3];

    expect(await tokenContract.balanceOf(token0, alice.address)).to.eq(totalSupplyToken0 - (token0Amount) + (expectedOutputAmount) - totalSupplyToken0 / 2n)
    expect(await tokenContract.balanceOf(token1, alice.address)).to.eq(totalSupplyToken1 - (token1Amount) - (swapAmount) - totalSupplyToken0 / 2n)
  })

  it('burn', async () => {
    const token0Amount = ethers.parseEther('3')
    const token1Amount = ethers.parseEther('3')
    await addLiquidity(token0Amount, token1Amount)

    const expectedLiquidity = ethers.parseEther('3')
    await tokenContract.transfer(pairTokenAddress, await pair.getAddress(), expectedLiquidity - MINIMUM_LIQUIDITY)

    await expect(pair.burn(alice.address))
      .to.emit(tokenContract, 'Transfer')
      .withArgs(await pair.getAddress(), AddressZero, expectedLiquidity - MINIMUM_LIQUIDITY)
      .to.emit(tokenContract, 'Transfer')
      .withArgs(await pair.getAddress(), alice.address, token0Amount - BigInt(1000))
      .to.emit(tokenContract, 'Transfer')
      .withArgs(await pair.getAddress(), alice.address, token1Amount - BigInt(1000))
      .to.emit(pair, 'Sync')
      .withArgs(1000, 1000)
      .to.emit(pair, 'Burn')
      .withArgs(alice.address, token0Amount - BigInt(1000), token1Amount - BigInt(1000), alice.address)

    expect(await pair.balanceOf(alice.address)).to.eq(0)
    const totalSupply = (await tokenContract.tokens(pairTokenAddress))[3];

    expect(totalSupply).to.eq(MINIMUM_LIQUIDITY)
    expect(await tokenContract.balanceOf(token0, await pair.getAddress())).to.eq(1000)
    expect(await tokenContract.balanceOf(token1, await pair.getAddress())).to.eq(1000)

    const totalSupplyToken0 = (await tokenContract.tokens(token0))[3]
    const totalSupplyToken1 = (await tokenContract.tokens(token1))[3]

    expect(await tokenContract.balanceOf(token0, alice.address)).to.eq(totalSupplyToken0 - BigInt(1000) - totalSupplyToken0 / 2n)
    expect(await tokenContract.balanceOf(token1, alice.address)).to.eq(totalSupplyToken1 - BigInt(1000) - totalSupplyToken0 / 2n)
  })
})
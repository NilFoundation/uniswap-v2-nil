import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Signer } from "ethers";
import { TokenLibrary } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers';

describe('TokenLibrary', () => {
	const totalSupply = ethers.parseEther('1000');

	let tokenContract: TokenLibrary;
	let tokenAddress: string;
	let alice: SignerWithAddress;
	let bob: SignerWithAddress;
	let other: SignerWithAddress;

	beforeEach(async () => {
		[alice, bob, other] = await ethers.getSigners();

		const TokenLibrary = await ethers.getContractFactory("TokenLibrary")
		tokenContract = await TokenLibrary.deploy();

		await tokenContract.newToken(
			"TestToken",
			"TT",
			18,
			totalSupply,
			await alice.getAddress()
		);

		const tokenCreatedFilter = tokenContract.filters.TokenCreated;
		const events = await tokenContract.queryFilter(tokenCreatedFilter, 'latest');

		tokenAddress = events[0].args[0];
	})

	it('balanceOf', async () => {
		expect(await tokenContract.balanceOf(tokenAddress, alice.address)).to.eq(totalSupply)
	})

	it('transfer', async () => {
		await tokenContract.connect(alice).transfer(tokenAddress, bob.address, ethers.parseEther('100'));

		expect(await tokenContract.balanceOf(tokenAddress, alice.address)).to.eq(totalSupply - ethers.parseEther('100'));
		expect(await tokenContract.balanceOf(tokenAddress, bob.address)).to.eq(ethers.parseEther('100'));
	})

	it('should allow to mint', async () => {
		await tokenContract.connect(alice).mint(tokenAddress, bob.address, ethers.parseEther('100'));
		expect(await tokenContract.balanceOf(tokenAddress, bob.address)).to.eq(ethers.parseEther('100'));
	})

	it('should not allow to mint if caller is not minter', async () => {
		await expect(tokenContract.connect(bob).mint(tokenAddress, bob.address, ethers.parseEther('100')))
			.to.be.revertedWith('TokenLib: not minter');
	})

	it('should incease allowance and check it', async () => {
		await tokenContract.connect(alice).approve(tokenAddress, bob.address, ethers.parseEther('100'));
		expect(await tokenContract.allowance(tokenAddress, alice.address, bob.address)).
			to.eq(ethers.parseEther('100'));

		expect(await tokenContract.allowance(tokenAddress, alice.address, bob.address)).to.eq(ethers.parseEther('100'));
	})

	it('Should approve more than address has and be reverted', async () => {
		await expect(tokenContract.connect(alice).approve(tokenAddress, bob.address, ethers.parseEther('10000')))
			.to.be.revertedWith('TokenLib: amount > balance');
	})

	it('Should transferFrom', async () => {
		await tokenContract.connect(alice).approve(tokenAddress, bob.address, ethers.parseEther('100'));
		await tokenContract.connect(bob).transferFrom(tokenAddress, alice.address, bob.address, ethers.parseEther('100'));

		expect(await tokenContract.balanceOf(tokenAddress, alice.address)).to.eq(totalSupply - ethers.parseEther('100'));
		expect(await tokenContract.balanceOf(tokenAddress, bob.address)).to.eq(ethers.parseEther('100'));
	})
})

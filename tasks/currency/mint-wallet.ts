import { task } from "hardhat/config";
import type { Currency } from "../../typechain-types";

task("mint-wallet", "Mint currency from two contracts and send it to a specified wallet")
.addParam("currency0", "The contract address of the first currency")
.addParam("currency1", "The contract address of the second currency")
.addParam("wallet", "The address of the wallet to receive the currency")
.addParam("amount", "The amount of currency to mint and send")
.setAction(async (taskArgs, hre) => {
	// Destructure parameters for clarity
	const mintAmount = BigInt(taskArgs.amount);
	const currency0Address = taskArgs.currency0;
	const currency1Address = taskArgs.currency1;
	const walletAddress = taskArgs.wallet;

	// Attach to the Currency contracts
	const CurrencyFactory = await hre.ethers.getContractFactory("Currency");
	const currency0 = CurrencyFactory.attach(currency0Address) as Currency;
	const currency1 = CurrencyFactory.attach(currency1Address) as Currency;

	// Mint and send Currency0
	console.log(`Minting ${mintAmount} Currency0 to wallet ${walletAddress}...`);
	await currency0.mintCurrencyPublic(mintAmount);
	await currency0.sendCurrencyPublic(walletAddress, await currency0.getCurrencyId(), mintAmount);

	// Mint and send Currency1
	console.log(`Minting ${mintAmount} Currency1 to wallet ${walletAddress}...`);
	await currency1.mintCurrencyPublic(mintAmount);
	await currency1.sendCurrencyPublic(walletAddress, await currency1.getCurrencyId(), mintAmount);

	// Verify the balance of the recipient wallet for both currencies
	const recipientBalanceCurrency0 = await currency0.getCurrencyBalanceOf(walletAddress);
	const recipientBalanceCurrency1 = await currency1.getCurrencyBalanceOf(walletAddress);

	console.log(`Recipient balance after transfer - Currency0: ${recipientBalanceCurrency0}, Currency1: ${recipientBalanceCurrency1}`);
});

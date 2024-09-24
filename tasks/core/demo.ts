import * as assert from "node:assert";
import {task} from "hardhat/config";
import type {Currency, UniswapV2Factory, UniswapV2Pair, UserWallet} from "../../typechain-types";
import {HardhatRuntimeEnvironment} from "hardhat/types";

task("demo", "Run demo for Uniswap Pairs and Factory")
    .setAction(async (taskArgs, hre) => {
        const walletAddress = process.env.WALLET_ADDR!;
        const wallet = new hre.ethers.Wallet(process.env.PRIVATE_KEY!);
        const shardId = 1;
        const mintAmount = 100000;
        const mintCurrency0Amount = 10000;
        const mintCurrency1Amount = 10000;
        const swapAmount = 1000;

        const {
            deployedContract: factoryContract,
            contractAddress: factoryAddress,
        } = await deployNilContract(hre, "UniswapV2Factory", [walletAddress]);
        const {
            deployedContract: Currency0Contract,
            contractAddress: currency0Address,
        } = await deployNilContract(hre, "Currency", ["currency0"]);
        const {
            deployedContract: Currency1Contract,
            contractAddress: currency1Address,
        } = await deployNilContract(hre, "Currency", ["currency1"]);

        console.log("Factory deployed " + factoryAddress);
        console.log("Currency0 deployed " + currency0Address);
        console.log("Currency1 deployed " + currency1Address);

        const {
            deployedContract: UserWalletContract,
            contractAddress: userWalletAddress,
        } = await deployNilContract(hre, "UserWallet", [wallet.signingKey.publicKey]);

        console.log("UserWallet deployed " + userWalletAddress);

        const factory = factoryContract as UniswapV2Factory;

        // 1. CREATE PAIR
        await factory.createPair(
            currency0Address.toLowerCase(),
            currency1Address.toLowerCase(),
            Math.floor(Math.random() * 10000000),
            shardId,
        );

        const pairAddress = await factory.getTokenPair(
            currency0Address.toLowerCase(),
            currency1Address.toLowerCase(),
        );

        // Log the pair address
        console.log(`Pair created successfully at address: ${pairAddress}`);

        // Attach to the Currency contract for both currencies

        const firstCurrency = Currency0Contract as Currency;
        const firstCurrencyId = await firstCurrency.getCurrencyId();
        console.log(`First currency ID: ${firstCurrencyId}`);

        const secondCurrency = Currency1Contract as Currency;
        const secondCurrencyId = await secondCurrency.getCurrencyId();
        console.log(`Second currency ID: ${secondCurrencyId}`);

        // Attach to the newly created Uniswap V2 Pair contract
        const pairContract = await hre.ethers.getContractFactory("UniswapV2Pair");
        const pair = pairContract.attach(pairAddress) as UniswapV2Pair;

        // Initialize the pair with currency addresses and IDs
        await pair.initialize(
            currency0Address.toLowerCase(),
            currency1Address.toLowerCase(),
            firstCurrencyId,
            secondCurrencyId,
        );

        console.log(`Pair initialized successfully at address: ${pairAddress}`);

        // 2. MINT CURRENCIES
        console.log(`Minting ${mintAmount} Currency0 to wallet ${walletAddress}...`);
        await firstCurrency.mintCurrencyPublic(mintAmount);
        await firstCurrency.sendCurrencyPublic(
            walletAddress,
            await firstCurrency.getCurrencyId(),
            mintAmount,
        );

        // Mint and send Currency1
        console.log(`Minting ${mintAmount} Currency1 to wallet ${walletAddress}...`);
        await secondCurrency.mintCurrencyPublic(mintAmount);
        await secondCurrency.sendCurrencyPublic(
            walletAddress,
            await secondCurrency.getCurrencyId(),
            mintAmount,
        );

        // Verify the balance of the recipient wallet for both currencies
        const recipientBalanceCurrency0 =
            await firstCurrency.getCurrencyBalanceOf(walletAddress);
        const recipientBalanceCurrency1 =
            await secondCurrency.getCurrencyBalanceOf(walletAddress);

        console.log(`Recipient balance after transfer - Currency0: ${recipientBalanceCurrency0}, Currency1: ${recipientBalanceCurrency1}`);


        // 3. PAIR: MINT
        const user = UserWalletContract as UserWallet;

        // Send currency amounts to the pair contract
        console.log(`Sending ${mintCurrency0Amount} of currency0 to ${pairAddress}...`);
        await user.sendCurrencyPublic(pairAddress, await firstCurrency.getCurrencyId(), mintCurrency0Amount);

        console.log(`Sending ${mintCurrency1Amount} of currency1 to ${pairAddress}...`);
        const sendtx = await user.sendCurrencyPublic(pairAddress, await secondCurrency.getCurrencyId(), mintCurrency1Amount);

        console.log("sendtx " + sendtx.hash)
        // Log balances in the pair contract
        const pairCurrency0Balance = await firstCurrency.getCurrencyBalanceOf(pairAddress);
        console.log("Pair Balance of Currency0:", pairCurrency0Balance.toString());

        const pairCurrency1Balance = await secondCurrency.getCurrencyBalanceOf(pairAddress);
        console.log("Pair Balance of Currency1:", pairCurrency1Balance.toString());

        // Mint liquidity
        console.log("Minting pair tokens...");
        await pair.mint(walletAddress);
        console.log("Liquidity added...");

        // Retrieve and log reserves from the pair
        const [reserve0, reserve1] = await pair.getReserves();
        console.log(`MINT RESULT: Reserves - Currency0: ${reserve0.toString()}, Currency1: ${reserve1.toString()}`);

        // Check and log liquidity provider balance
        const lpBalance = await pair.getCurrencyBalanceOf(walletAddress);
        console.log("MINT RESULT: Liquidity provider balance in wallet:", lpBalance.toString());

        // Retrieve and log total supply for the pair
        const totalSupply = await pair.getCurrencyTotalSupply();
        console.log("MINT RESULT: Total supply of pair tokens:", totalSupply.toString());

        // 4. PAIR: SWAP
        const expectedOutputAmount = calculateOutputAmount(
            BigInt(swapAmount),
            reserve0,
            reserve1,
        );
        console.log(
            "Expected output amount for swap:",
            expectedOutputAmount.toString(),
        );

        // Log balances before the swap
        const balanceCurrency0Before =
            await firstCurrency.getCurrencyBalanceOf(userWalletAddress);
        const balanceCurrency1Before =
            await secondCurrency.getCurrencyBalanceOf(userWalletAddress);
        console.log(
            "Balance of currency0 before swap:",
            balanceCurrency0Before.toString(),
        );
        console.log(
            "Balance of currency1 before swap:",
            balanceCurrency1Before.toString(),
        );

        // Attach to the UserWallet contract

        // Send currency0 to the pair contract
        await user.sendCurrencyPublic(pairAddress, await firstCurrency.getCurrencyId(), swapAmount);
        console.log(`Sent ${swapAmount.toString()} of currency0 to the pair contract.`);

        // Execute the swap
        console.log("Executing swap...");
        await pair.swap(0, expectedOutputAmount, userWalletAddress);
        console.log("Swap executed successfully.");

        // Log balances after the swap
        const balanceCurrency0After =
            await firstCurrency.getCurrencyBalanceOf(userWalletAddress);
        const balanceCurrency1After =
            await secondCurrency.getCurrencyBalanceOf(userWalletAddress);
        console.log(
            "SWAP RESULT: Balance of currency0 after swap:",
            balanceCurrency0After.toString(),
        );
        console.log(
            "SWAP RESULT: Balance of currency1 after swap:",
            balanceCurrency1After.toString(),
        );

        // 5. PAIR: BURN
        const total = await pair.getCurrencyTotalSupply();
        console.log("Total supply:", total.toString());

        // Fetch and log pair balances before burn
        const pairBalanceToken0 = await firstCurrency.getCurrencyBalanceOf(
            pairAddress.toLowerCase(),
        );
        const pairBalanceToken1 = await secondCurrency.getCurrencyBalanceOf(
            pairAddress.toLowerCase(),
        );
        console.log(
            "Pair Balance token0 before burn:",
            pairBalanceToken0.toString(),
        );
        console.log(
            "Pair Balance token1 before burn:",
            pairBalanceToken1.toString(),
        );

        // Fetch and log user balances before burn
        let userBalanceToken0 =
            await firstCurrency.getCurrencyBalanceOf(walletAddress);
        let userBalanceToken1 =
            await secondCurrency.getCurrencyBalanceOf(walletAddress);
        console.log(
            "User Balance token0 before burn:",
            userBalanceToken0.toString(),
        );
        console.log(
            "User Balance token1 before burn:",
            userBalanceToken1.toString(),
        );

        const lpAddress = await pair.getCurrencyId();
        const userLpBalance = await pair.getCurrencyBalanceOf(walletAddress);
        console.log("Total LP balance for user wallet:", userLpBalance.toString());

        // Send LP tokens to the user wallet
        await user.sendCurrencyPublic(
            pairAddress.toLowerCase(),
            lpAddress,
            userLpBalance,
        );

        // Execute burn
        console.log("Executing burn...");
        await pair.burn(walletAddress);
        console.log("Burn executed.");
        console.log("Built tokens");

        // Log balances after burn
        const balanceToken0 = await firstCurrency.getCurrencyBalanceOf(
            pairAddress.toLowerCase(),
        );
        const balanceToken1 = await secondCurrency.getCurrencyBalanceOf(
            pairAddress.toLowerCase(),
        );
        console.log("BURN RESULT: Pair Balance token0 after burn:", balanceToken0.toString());
        console.log("BURN RESULT: Pair Balance token1 after burn:", balanceToken1.toString());

        userBalanceToken0 = await firstCurrency.getCurrencyBalanceOf(walletAddress);
        userBalanceToken1 = await secondCurrency.getCurrencyBalanceOf(walletAddress);
        console.log(
            "BURN RESULT: User Balance token0 after burn:",
            userBalanceToken0.toString(),
        );
        console.log(
            "BURN RESULT: User Balance token1 after burn:",
            userBalanceToken1.toString(),
        );

        // Fetch and log reserves after burn
        const reserves = await pair.getReserves();
        console.log(
            "BURN RESULT: Reserves from pair after burn:",
            reserves[0].toString(),
            reserves[1].toString(),
        );
    });


export async function deployNilContract(hre: HardhatRuntimeEnvironment, name: string, args: any[] = []) {
    const factory = await hre.ethers.getContractFactory(name);
    assert.ok(factory.runner);
    assert.ok(factory.runner.sendTransaction);

    const deployTx = await factory.getDeployTransaction(...args);
    const sentTx = await factory.runner.sendTransaction(deployTx);
    const txReceipt = await sentTx.wait();

    if (!txReceipt || !txReceipt.contractAddress) {
        throw new Error("Contract deployment failed");
    }

    const deployedContract = factory.attach(txReceipt.contractAddress);
    return {deployedContract, contractAddress: txReceipt.contractAddress};
}

function calculateOutputAmount(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
): bigint {
    const amountInWithFee = amountIn * BigInt(997);
    const numerator = amountInWithFee * reserveOut;
    const denominator = reserveIn * BigInt(1000) + amountInWithFee;
    return numerator / denominator;
}

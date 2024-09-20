import { task } from "hardhat/config";
import type {
  Currency,
  UniswapV2Pair,
  UserWallet,
} from "../../../typechain-types";

task("mint", "Mint currencies and add liquidity to the pair")
  .addParam("pair", "The address of the pair contract")
  .addParam("wallet", "The address of the user contract")
  .addParam("amount0", "The amount of the first currency to mint")
  .addParam("amount1", "The amount of the second currency to mint")
  .setAction(async (taskArgs, hre) => {
    // Destructure parameters for clarity
    const pairAddress = taskArgs.pair;
    const walletAddress = taskArgs.wallet;
    const amount0 = taskArgs.amount0;
    const amount1 = taskArgs.amount1;

    // Attach to the Uniswap V2 Pair contract
    const PairFactory = await hre.ethers.getContractFactory("UniswapV2Pair");
    const pair = PairFactory.attach(pairAddress) as UniswapV2Pair;

    // Fetch currency addresses from the pair contract
    const currency0Address = await pair.token0();
    const currency1Address = await pair.token1();

    console.log("Currency 0 Address:", currency0Address.toString());
    console.log("Currency 1 Address:", currency1Address.toString());

    // Attach to the Currency contracts
    const CurrencyFactory = await hre.ethers.getContractFactory("Currency");
    const currency0 = CurrencyFactory.attach(currency0Address) as Currency;
    const currency1 = CurrencyFactory.attach(currency1Address) as Currency;

    // Retrieve and log currency IDs
    const currency0Id = await currency0.getCurrencyId();
    console.log("Currency 0 ID:", currency0Id);

    const currency1Id = await currency1.getCurrencyId();
    console.log("Currency 1 ID:", currency1Id);

    // Attach to the UserWallet contract
    const UserFactory = await hre.ethers.getContractFactory("UserWallet");
    const user = UserFactory.attach(walletAddress) as UserWallet;

    // Send currency amounts to the pair contract
    console.log(`Sending ${amount0} of currency0 to ${pairAddress}...`);
    await user.sendCurrencyPublic(pairAddress, currency0Id, amount0);

    console.log(`Sending ${amount1} of currency1 to ${pairAddress}...`);
    await user.sendCurrencyPublic(pairAddress, currency1Id, amount1);

    // Log balances in the pair contract
    const pairCurrency0Balance =
      await currency0.getCurrencyBalanceOf(pairAddress);
    console.log("Pair Balance 0:", pairCurrency0Balance.toString());

    const pairCurrency1Balance =
      await currency1.getCurrencyBalanceOf(pairAddress);
    console.log("Pair Balance 1:", pairCurrency1Balance.toString());

    // Mint liquidity
    console.log("Minting pair tokens...");
    await pair.mint(walletAddress);
    console.log("Liquidity added...");

    // Retrieve and log reserves from the pair
    const [reserve0, reserve1] = await pair.getReserves();
    console.log(
      `Reserves - Currency0: ${reserve0.toString()}, Currency1: ${reserve1.toString()}`,
    );

    // Check and log liquidity provider balance
    const lpBalance = await pair.getCurrencyBalanceOf(walletAddress);
    console.log("Liquidity provider balance in wallet:", lpBalance.toString());

    // Retrieve and log total supply for the pair
    const totalSupply = await pair.getCurrencyTotalSupply();
    console.log("Total supply of pair tokens:", totalSupply.toString());
  });

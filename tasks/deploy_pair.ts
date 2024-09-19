import {task} from "hardhat/config";
import {UniswapV2Factory, UniswapV2Pair, Token} from "../typechain-types";

task("deploy_pair", "Deploy pair")
    .addParam("factory", "Factory")
    .addParam("token0")
    .addParam("token1")
    .setAction(async (taskArgs, hre) => {

        const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
        const factory = Factory.attach(taskArgs.factory) as UniswapV2Factory;

        const currentPair = await factory.getTokenPair(taskArgs.token0.toLowerCase(), taskArgs.token1.toLowerCase())
        if (currentPair == "0x0000000000000000000000000000000000000000") {
            await factory.createPair(taskArgs.token0.toLowerCase(), taskArgs.token1.toLowerCase(), Math.floor(Math.random() * 10000000))
        }

        const result = (await factory.getTokenPair(taskArgs.token0.toLowerCase(), taskArgs.token1.toLowerCase())).toLowerCase()

        const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
        const pair = Pair.attach(result) as UniswapV2Pair;

        const Token = await hre.ethers.getContractFactory("Token");
        const token0Contract = Token.attach(taskArgs.token0.toLowerCase()) as Token;
        const token1Contract = Token.attach(taskArgs.token1.toLowerCase()) as Token;

        const token0Id = await token0Contract.getCurrencyId();
        const token1Id = await token1Contract.getCurrencyId();

        await pair.initialize(
            taskArgs.token0.toLowerCase(),
            taskArgs.token1.toLowerCase(),
            token0Id,
            token1Id
        )

        console.log("Pair " + result)
    });

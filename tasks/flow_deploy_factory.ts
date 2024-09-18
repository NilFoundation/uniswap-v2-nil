import {task} from "hardhat/config";

task("flow_deploy_factory", "Deploy 2 tokens and factory")
    .setAction(async (taskArgs, hre) => {
        const walletAddress = process.env.WALLET_ADDR!;

        const Token = await hre.ethers.getContractFactory("Token");
        const token1 = await Token.deploy("Token1");
        const token2 = await Token.deploy("Token1");

        const Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
        const factory = await Factory.deploy(walletAddress.toLowerCase());

        console.log("2 Tokens and Factory contracts have been deployed. Please copy the addresses from the logs");
    });

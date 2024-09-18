import {task} from "hardhat/config";

task("deploy_token", "Deploy token")
    .setAction(async (taskArgs, hre) => {

        const Token = await hre.ethers.getContractFactory("Token");
        const contract = await Token.deploy("Token1");

        console.log("Deployed " + JSON.stringify(contract));
    });

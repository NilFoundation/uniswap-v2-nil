import {task} from "hardhat/config";

task("deploy_factory", "Deploy factoru")
    .addParam("owner", "Owner")
    .setAction(async (taskArgs, hre) => {

        const UniswapV2Factory = await hre.ethers.getContractFactory("UniswapV2Factory");
        const contract = await UniswapV2Factory.deploy(taskArgs.owner.toLowerCase());

        console.log("Deployed " + JSON.stringify(contract));
    });

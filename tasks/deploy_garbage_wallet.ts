import {task} from "hardhat/config";
import {GarbageWallet} from "../typechain-types";

task("deploy_garbage", "Deploy garbage")
    .setAction(async (taskArgs, hre) => {

        const GarbageWallet = await hre.ethers.getContractFactory("GarbageWallet");
        const wallet = await GarbageWallet.deploy();
    });

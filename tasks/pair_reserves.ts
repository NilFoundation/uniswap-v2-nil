import {task} from "hardhat/config";
import {UniswapV2Factory, UniswapV2Pair} from "../typechain-types";

task("get_reserves", "Get reserver")
    .addParam("pair", "Pair")
    .setAction(async (taskArgs, hre) => {

        const Pair = await hre.ethers.getContractFactory("UniswapV2Pair");
        const pair = Pair.attach(taskArgs.pair.toLowerCase()) as UniswapV2Pair;
        const result = await pair.getReserves();

        console.log(result);
    });

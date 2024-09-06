import {task} from "hardhat/config";
import {Faucet, Token, Wallet} from "../typechain-types";

task("faucet", "Faucet")
    .addParam("addr", "Address")
    .setAction(async (taskArgs, hre) => {


        const Faucet = await hre.ethers.getContractFactory("Faucet");
        const contract = Faucet.attach("0x000100000000000000000000000000000FA00CE7".toLowerCase()) as Faucet;
        const result = await contract.withdrawTo(taskArgs.addr.toLowerCase(), 10000000);

        await sleep(1000);

        console.log("Result " + JSON.stringify(result));

    });

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

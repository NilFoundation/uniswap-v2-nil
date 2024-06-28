import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

module.exports = buildModule("IncrementerModule", (m: any) => {
	const tokenLib = m.contract("TokenLibrary");
	const factory = m.contract("UniswapV2Factory", [ethers.ZeroAddress]);
	return { tokenLib, factory };
});

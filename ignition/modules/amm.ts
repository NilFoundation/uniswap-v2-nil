import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers } from "ethers";

module.exports = buildModule("DEX", (m: any) => {
	const tokenLib = m.contract("TokenLibrary");
	const factory = m.contract("UniswapV2Factory", [ethers.ZeroAddress, tokenLib]);
	return { tokenLib, factory };
});

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

module.exports = buildModule("DEX", (m: any) => {
	const tokenLib = m.contract("TokenLibrary");
	const factory = m.contract("UniswapV2Pair");
	return { tokenLib, factory };
});

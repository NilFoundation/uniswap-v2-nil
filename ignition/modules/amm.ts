import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

module.exports = buildModule("DEX", (m: any) => {
	const factory = m.contract("UniswapV2Factory", ["0x00019c49baa606A8781656C39136CbAfe73377c4".toLowerCase()]);
	console.log("Deployed " + JSON.stringify(factory));
	return { factory };
});

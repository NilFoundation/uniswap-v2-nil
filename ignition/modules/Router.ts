import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

module.exports = buildModule("DeployUniswapV2Router01", (m) => {
	const factory = m.getParameter("factory", "0x0000000000000000000000000000000000000000");

	const router = m.contract("UniswapV2Router01", [factory]);

	return { router };
});

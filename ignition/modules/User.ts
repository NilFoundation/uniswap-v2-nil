import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

module.exports = buildModule("DeployUser", (m) => {
  const token = m.contract("UserWallet", [m.getParameter("publicKey", "")]);

  return { token };
});

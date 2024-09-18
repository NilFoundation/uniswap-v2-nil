import '@nomicfoundation/hardhat-chai-matchers'
import "@nomicfoundation/hardhat-ignition-ethers";
import '@nomicfoundation/hardhat-ethers'
import '@typechain/hardhat'
import "@nomicfoundation/hardhat-ignition-ethers";
import * as dotenv from "dotenv"
import type { NilHardhatUserConfig } from "@nilfoundation/hardhat-plugin";
import "@nilfoundation/hardhat-plugin";

// Token Tasks
import "./tasks/currency/info"
import "./tasks/currency/send";
import "./tasks/currency/mint"

// Other Tasks
import "./tasks/initialize";
import "./tasks/swap";
import "./tasks/sync";
import "./tasks/skim";
import "./tasks/burn";
import "./tasks/get_pair";

import "./tasks/pair_reserves";
import "./tasks/flow_deploy_factory";
import "./tasks/flow_swap";


dotenv.config();

const config: NilHardhatUserConfig = {
  ignition: {
    requiredConfirmations: 1,
  },
  solidity: "0.8.24",
  networks: {
    nil: {
      url: process.env.NIL_RPC_ENDPOINT,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  walletAddress: process.env.WALLET_ADDR,
};

export default config;

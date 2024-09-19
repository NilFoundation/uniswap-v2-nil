import '@nomicfoundation/hardhat-chai-matchers'
import "@nomicfoundation/hardhat-ignition-ethers";
import '@nomicfoundation/hardhat-ethers'
import '@typechain/hardhat'
import "@nomicfoundation/hardhat-ignition-ethers";
import * as dotenv from "dotenv"
import type { NilHardhatUserConfig } from "@nilfoundation/hardhat-plugin";
import "@nilfoundation/hardhat-plugin";

// Tasks
import "./tasks/initialize";
import "./tasks/swap";
import "./tasks/sync";
import "./tasks/skim";
import "./tasks/burn";
import "./tasks/deploy_token";
import "./tasks/mint_token";
import "./tasks/deploy_factory";
import "./tasks/deploy_pair";
import "./tasks/get_pair";
import "./tasks/token_info";
import "./tasks/send_token";
import "./tasks/pair_reserves";
import "./tasks/flow_deploy_factory";
import "./tasks/flow_swap";
import "./tasks/router_deploy";
import "./tasks/router_init";
import "./tasks/router_debug";

dotenv.config();

const config: NilHardhatUserConfig = {
  ignition: {
    requiredConfirmations: 1,
  },
  solidity: {
    compilers: [{
      version: "0.6.6",
      settings: {
        optimizer: {
          enabled: true,
          runs: 2000,
        },
      }
    },
    {
      version: "0.8.0",
      settings: {
        optimizer: {
          enabled: true,
          runs: 2000,
        },
      }
    },
    {
      version: "0.8.20",
      settings: {
        optimizer: {
          enabled: true,
          runs: 2000,
        },
      }
    },
    {
      version: "0.5.16",
      settings: {
        optimizer: {
          enabled: true,
          runs: 2000,
        },
      }
    }
    ]
  },
  networks: {
    nil: {
      url: process.env.NIL_RPC_ENDPOINT,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  walletAddress: process.env.WALLET_ADDR,
  debug: true,
};

export default config;

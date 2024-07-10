import '@nomicfoundation/hardhat-chai-matchers'
import "@nomicfoundation/hardhat-ignition-ethers";
import '@nomicfoundation/hardhat-ethers'
import '@typechain/hardhat'
import "@nomicfoundation/hardhat-ignition-ethers";
import * as dotenv from "dotenv"
import type { NilHardhatUserConfig } from "@nilfoundation/hardhat-plugin";
import "@nilfoundation/hardhat-plugin";

import "./tasks/swap";

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
  directTxGasLimit: 500000
};

export default config;

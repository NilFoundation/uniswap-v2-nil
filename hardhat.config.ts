import { HardhatUserConfig } from "hardhat/config";
import '@nomicfoundation/hardhat-chai-matchers'
import '@nomicfoundation/hardhat-ethers'
import '@typechain/hardhat'

const config: HardhatUserConfig = {
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
};

export default config;

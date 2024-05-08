/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0
 * See the file LICENSE.txt for more information.
 */

import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-abi-exporter";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import "hardhat-gas-reporter";

import { HardhatUserConfig } from "hardhat/config";

// Read MNEMONIC from env variable
const mnemonic = process.env.MNEMONIC;

const config: HardhatUserConfig = {
  // Networks (may need to specify gas for public chains)
  networks: {
    hardhat: {
      accounts: mnemonic ? { mnemonic } : undefined,
      allowUnlimitedContractSize: true,
      tags: ["ChainID", "TestTokens", "UniswapV3", "LiquidityPools", "Tests"],
    },
    localhost: {
      url: "http://localhost:8545",
      accounts: mnemonic ? { mnemonic } : undefined,
      allowUnlimitedContractSize: true,
      tags: ["ChainID", "TestTokens", "UniswapV3", "LiquidityPools", "Tests"],
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.PROJECT_ID}`,
      chainId: 1,
      accounts: mnemonic ? { mnemonic } : undefined,
      tags: [],
    },
    base: {
      url: `https://base-sepolia.infura.io/v3/${process.env.PROJECT_ID}`,
      chainId: 8453,
      accounts: mnemonic ? { mnemonic } : undefined,
      tags: [],
    },
  },

  // Compilers
  solidity: {
    compilers: [
      {
        // Project version
        version: "0.8.25",
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
      {
        // Required by OpenZeppelin V3
        // Required by Uniswap V3
        version: "0.7.6",
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },

  // Paths
  paths: {
    artifacts: "artifacts",
    deploy: "deploy",
    deployments: "deployments",
  },

  // ABI exporter extension (hardhat-abi-exporter)
  abiExporter: {
    // Path to ABI export directory (relative to Hardhat root)
    path: "./src/abi",
    // Whether to automatically export ABIs during compilation
    runOnCompile: true,
    // Whether to delete old files in path
    clear: true,
    // Whether to use interface-style formatting of output for better readability
    pretty: true,
  },

  // Typechain extension (@typechain/hardhat)
  typechain: {
    outDir: "src/types",
    target: "ethers-v6",
  },

  // Deployment extension (hardhat-deploy)
  namedAccounts: {
    deployer: {
      default: 0,
    },
    beneficiary: {
      default: 1,
    },
  },

  // Gas reporter extension (hardhat-gas-reporter)
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
  },
};

export default config;

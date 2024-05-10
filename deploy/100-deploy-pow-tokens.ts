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

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";

import {
  LPNFT_CONTRACT,
  LPPOW1_TOKEN_CONTRACT,
  LPPOW5_TOKEN_CONTRACT,
  LPSFT_CONTRACT,
  NOLPSFT_CONTRACT,
  NOPOW5_TOKEN_CONTRACT,
  POW1_TOKEN_CONTRACT,
  POW5_TOKEN_CONTRACT,
} from "../src/contracts/hardhat/dapp";
import { AddressBook } from "../src/interfaces/addressBook";
import { getAddressBook } from "../src/utils/getAddressBook";

//
// Deploy the Uniswap V3 pool factory and token routes
//
const func: DeployFunction = async (hardhat_re: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hardhat_re;
  const { deployer } = await getNamedAccounts();

  const opts: DeployOptions = {
    deterministicDeployment: true,
    from: deployer,
    log: true,
  };

  // Get the network name
  const networkName: string = hardhat_re.network.name;

  // Get the contract addresses
  const addressBook: AddressBook = await getAddressBook(networkName);

  //////////////////////////////////////////////////////////////////////////////
  // Deploy contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy POW1 token
  //

  if (addressBook.pow1Token) {
    console.log(`Using ${POW1_TOKEN_CONTRACT} at ${addressBook.pow1Token}`);
  } else {
    console.log(`Deploying ${POW1_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(POW1_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.pow1Token = tx.address;
  }

  //
  // Deploy POW5 token
  //

  if (addressBook.pow5Token) {
    console.log(`Using ${POW5_TOKEN_CONTRACT} at ${addressBook.pow5Token}`);
  } else {
    console.log(`Deploying ${POW5_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(POW5_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.pow5Token = tx.address;
  }

  //
  // Deploy LPPOW1 token
  //

  if (addressBook.lpPow1Token) {
    console.log(`Using ${LPPOW1_TOKEN_CONTRACT} at ${addressBook.lpPow1Token}`);
  } else {
    console.log(`Deploying ${LPPOW1_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(LPPOW1_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.lpPow1Token = tx.address;
  }

  //
  // Deploy LPPOW5 token
  //

  if (addressBook.lpPow5Token) {
    console.log(`Using ${LPPOW5_TOKEN_CONTRACT} at ${addressBook.lpPow5Token}`);
  } else {
    console.log(`Deploying ${LPPOW5_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(LPPOW5_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.lpPow5Token = tx.address;
  }

  //
  // Deploy NOPOW5 token
  //

  if (addressBook.noPow5Token) {
    console.log(`Using ${NOPOW5_TOKEN_CONTRACT} at ${addressBook.noPow5Token}`);
  } else {
    console.log(`Deploying ${NOPOW5_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(NOPOW5_TOKEN_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
      ],
    });
    addressBook.noPow5Token = tx.address;
  }

  //
  // Deploy LP-NFT template contract
  //

  if (addressBook.lpNft) {
    console.log(`Using ${LPNFT_CONTRACT} at ${addressBook.lpNft}`);
  } else {
    console.log(`Deploying ${LPNFT_CONTRACT}`);
    const tx = await deployments.deploy(LPNFT_CONTRACT, {
      ...opts,
      args: [
        addressBook.pow1Token!, // pow1Token
        addressBook.pow5Token!, // pow5Token
        addressBook.lpPow1Token!, // lpPow1Token
        addressBook.lpPow5Token!, // lpPow5Token
        addressBook.noPow5Token!, // noPow5Token
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      ],
    });
    addressBook.lpNft = tx.address;
  }

  //
  // Deploy LP-SFT token
  //

  if (addressBook.lpSft) {
    console.log(`Using ${LPSFT_CONTRACT} at ${addressBook.lpSft}`);
  } else {
    console.log(`Deploying ${LPSFT_CONTRACT}`);
    const tx = await deployments.deploy(LPSFT_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
        addressBook.lpNft!, // lpNftTemplate
        addressBook.pow1Token!, // pow1Token
        addressBook.pow5Token!, // pow5Token
        addressBook.lpPow1Token!, // lpPow1Token
        addressBook.lpPow5Token!, // lpPow5Token
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
      ],
    });
    addressBook.lpSft = tx.address;
  }

  //
  // Deploy NOLPSFT token
  //

  if (addressBook.noLpSft) {
    console.log(`Using ${NOLPSFT_CONTRACT} at ${addressBook.noLpSft}`);
  } else {
    console.log(`Deploying ${NOLPSFT_CONTRACT}`);
    const tx = await deployments.deploy(NOLPSFT_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
        addressBook.lpSft!, // lpSft
      ],
    });
    addressBook.noLpSft = tx.address;
  }
};

export default func;
func.tags = ["POWTokens"];

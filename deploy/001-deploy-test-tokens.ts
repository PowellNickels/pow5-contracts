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

import { getAddressBook } from "../src/addresses/addressBook";
import { WRAPPED_NATIVE_TOKEN_CONTRACT } from "../src/contracts/depends";
import { USDC_CONTRACT } from "../src/contracts/testing";
import { AddressBook } from "../src/interfaces";

//
// Deploy test token contracts
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

  // Deploy wrapped native token
  if (addressBook.wrappedNativeToken) {
    console.log(
      `Using ${WRAPPED_NATIVE_TOKEN_CONTRACT} at ${addressBook.wrappedNativeToken}`,
    );
  } else {
    console.log(`Deploying ${WRAPPED_NATIVE_TOKEN_CONTRACT}`);
    const tx = await deployments.deploy(WRAPPED_NATIVE_TOKEN_CONTRACT, opts);
    addressBook.wrappedNativeToken = tx.address;
  }

  // Deploy USDC token
  if (addressBook.usdcToken) {
    console.log(`Using ${USDC_CONTRACT} at ${addressBook.usdcToken}`);
  } else {
    console.log(`Deploying ${USDC_CONTRACT}`);
    const tx = await deployments.deploy(USDC_CONTRACT, opts);
    addressBook.usdcToken = tx.address;
  }
};

export default func;
func.tags = ["TestTokens"];

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

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "ethers";
import * as hardhat from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeploymentsExtension } from "hardhat-deploy/types";
import { getUnnamedSigners } from "hardhat-deploy-ethers/dist/src/helpers";

import { getAddressBook } from "../addressBook";
import { AddressBook, ContractLibrary } from "../interfaces";

//
// Fixture setup
//

async function setupFixture(
  hardhat_re: HardhatRuntimeEnvironment,
): Promise<ContractLibrary> {
  // Ensure we start from a fresh deployment
  const deployments: DeploymentsExtension = hardhat_re.deployments;
  await deployments.fixture();

  // Get the beneficiary signer
  const signers: SignerWithAddress[] = await getUnnamedSigners(hardhat_re);
  const beneficiary: SignerWithAddress = signers[1];

  // Get network name
  const networkName: string = hardhat.network.name;

  // Load contract addresses
  const addressBook: AddressBook = await getAddressBook(networkName);

  // Construct the contracts for beneficiary wallet

  return {
  };
}

export { setupFixture };

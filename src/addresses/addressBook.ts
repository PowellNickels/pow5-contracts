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

/* eslint @typescript-eslint/no-explicit-any: "off" */
/* eslint no-empty: "off" */

import fs from "fs";
import * as hardhat from "hardhat";

import { WRAPPED_NATIVE_TOKEN_CONTRACT } from "../contracts/depends";
import { TEST_ERC1155_ENUMERABLE_CONTRACT } from "../contracts/testing";
import { AddressBook } from "../interfaces";
import baseAddresses from "./base.json";
import mainnetAddresses from "./mainnet.json";

//
// Address book instance
//

const addressBook: { [networkName: string]: AddressBook } = {
  base: baseAddresses,
  mainnet: mainnetAddresses,
};

//
// Utility functions
//

async function getAddressBook(networkName: string): Promise<AddressBook> {
  return {
    testErc1155Enumerable: await getContractAddress(
      "testErc1155Enumerable",
      TEST_ERC1155_ENUMERABLE_CONTRACT,
      networkName,
    ),
    wrappedNativeToken: await getContractAddress(
      "wrappedNativeToken",
      WRAPPED_NATIVE_TOKEN_CONTRACT,
      networkName,
    ),
  };
}

function loadDeployment(
  networkName: string,
  contractName: string,
): string | undefined {
  try {
    const deployment = JSON.parse(
      fs
        .readFileSync(
          `${__dirname}/../../deployments/${networkName}/${contractName}.json`,
        )
        .toString(),
    );
    if (deployment.address) {
      return deployment.address;
    }
  } catch (e) {}

  // Not found
  return;
}

const getContractAddress = async (
  contractSymbol: string,
  contractName: string,
  networkName: string,
): Promise<string | undefined> => {
  // Look up address in address book
  if (
    addressBook[networkName] &&
    addressBook[networkName][contractSymbol as keyof AddressBook]
  ) {
    return addressBook[networkName][contractSymbol as keyof AddressBook];
  }

  if (addressBook[networkName] === undefined) {
    addressBook[networkName] = {};
  }

  // Look up address if the contract has a known deployment
  const deploymentAddress = loadDeployment(networkName, contractName);
  if (deploymentAddress) {
    addressBook[networkName][contractName as keyof AddressBook] =
      deploymentAddress;
    return deploymentAddress;
  }

  // Look up address in deployments system
  try {
    const contractDeployment = await hardhat.deployments.get(contractName);
    if (contractDeployment && contractDeployment.address) {
      addressBook[networkName][contractName as keyof AddressBook] =
        contractDeployment.address;
      return contractDeployment.address;
    }
  } catch (e) {}

  // Not found
  return;
};

function writeAddress(
  networkName: string,
  contractName: string,
  address: string,
  abi: { [key: string]: any },
): void {
  console.log(`Deployed ${contractName} to ${address}`);

  // Write the file
  const addressFile = `${__dirname}/../../deployments/${networkName}/${contractName}.json`;
  fs.writeFileSync(addressFile, JSON.stringify({ address, abi }, undefined, 2));

  // Save the address
  addressBook[networkName][contractName as keyof AddressBook] = address;
}

export { getAddressBook, writeAddress };

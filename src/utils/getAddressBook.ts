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

import baseAddresses from "../addresses/base.json";
import mainnetAddresses from "../addresses/mainnet.json";
import {
  LPPOW1_TOKEN_CONTRACT,
  LPPOW5_TOKEN_CONTRACT,
  LPSFT_CONTRACT,
  NOLPSFT_CONTRACT,
  NOPOW5_TOKEN_CONTRACT,
  POW1_POOL_CONTRACT,
  POW1_POOL_FACTORY_CONTRACT,
  POW1_POOLER_CONTRACT,
  POW1_STAKER_CONTRACT,
  POW1_SWAPPER_CONTRACT,
  POW1_TOKEN_CONTRACT,
  POW5_POOL_CONTRACT,
  POW5_POOL_FACTORY_CONTRACT,
  POW5_POOLER_CONTRACT,
  POW5_STAKER_CONTRACT,
  POW5_SWAPPER_CONTRACT,
  POW5_TOKEN_CONTRACT,
} from "../contracts/hardhat/dapp";
import {
  UNISWAP_V3_FACTORY_CONTRACT,
  UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
  UNISWAP_V3_NFT_MANAGER_CONTRACT,
  UNISWAP_V3_STAKER_CONTRACT,
  WRAPPED_NATIVE_TOKEN_CONTRACT,
  WRAPPED_NATIVE_USDC_POOL_CONTRACT,
  WRAPPED_NATIVE_USDC_POOL_FACTORY_CONTRACT,
} from "../contracts/hardhat/depends";
import {
  TEST_ERC1155_ENUMERABLE_CONTRACT,
  TEST_LIQUIDITY_MATH_CONTRACT,
  TEST_TICK_MATH_CONTRACT,
  USDC_CONTRACT,
} from "../contracts/hardhat/testing";
import { AddressBook } from "../interfaces/addressBook";

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
    lpPow1Token: await getContractAddress(
      "lpPow1Token",
      LPPOW1_TOKEN_CONTRACT,
      networkName,
    ),
    lpPow5Token: await getContractAddress(
      "lpPow5Token",
      LPPOW5_TOKEN_CONTRACT,
      networkName,
    ),
    lpSft: await getContractAddress("lpSft", LPSFT_CONTRACT, networkName),
    noLpSft: await getContractAddress("noLpSft", NOLPSFT_CONTRACT, networkName),
    noPow5Token: await getContractAddress(
      "noPow5Token",
      NOPOW5_TOKEN_CONTRACT,
      networkName,
    ),
    pow1Pool: await getContractAddress(
      "pow1Pool",
      POW1_POOL_CONTRACT,
      networkName,
    ),
    pow1Pooler: await getContractAddress(
      "pow1Pooler",
      POW1_POOLER_CONTRACT,
      networkName,
    ),
    pow1PoolFactory: await getContractAddress(
      "pow1PoolFactory",
      POW1_POOL_FACTORY_CONTRACT,
      networkName,
    ),
    pow1Staker: await getContractAddress(
      "pow1Staker",
      POW1_STAKER_CONTRACT,
      networkName,
    ),
    pow1Swapper: await getContractAddress(
      "pow1Swapper",
      POW1_SWAPPER_CONTRACT,
      networkName,
    ),
    pow1Token: await getContractAddress(
      "pow1Token",
      POW1_TOKEN_CONTRACT,
      networkName,
    ),
    pow5Pool: await getContractAddress(
      "pow5Pool",
      POW5_POOL_CONTRACT,
      networkName,
    ),
    pow5Pooler: await getContractAddress(
      "pow5Pooler",
      POW5_POOLER_CONTRACT,
      networkName,
    ),
    pow5PoolFactory: await getContractAddress(
      "pow5PoolFactory",
      POW5_POOL_FACTORY_CONTRACT,
      networkName,
    ),
    pow5Staker: await getContractAddress(
      "pow5Staker",
      POW5_STAKER_CONTRACT,
      networkName,
    ),
    pow5Swapper: await getContractAddress(
      "pow5Swapper",
      POW5_SWAPPER_CONTRACT,
      networkName,
    ),
    pow5Token: await getContractAddress(
      "pow5Token",
      POW5_TOKEN_CONTRACT,
      networkName,
    ),
    testErc1155Enumerable: await getContractAddress(
      "testErc1155Enumerable",
      TEST_ERC1155_ENUMERABLE_CONTRACT,
      networkName,
    ),
    testLiquidityMath: await getContractAddress(
      "testLiquidityMath",
      TEST_LIQUIDITY_MATH_CONTRACT,
      networkName,
    ),
    testTickMath: await getContractAddress(
      "testTickMath",
      TEST_TICK_MATH_CONTRACT,
      networkName,
    ),
    uniswapV3Factory: await getContractAddress(
      "uniswapV3Factory",
      UNISWAP_V3_FACTORY_CONTRACT,
      networkName,
    ),
    uniswapV3NftDescriptor: await getContractAddress(
      "uniswapV3NftDescriptor",
      UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
      networkName,
    ),
    uniswapV3NftManager: await getContractAddress(
      "uniswapV3NftManager",
      UNISWAP_V3_NFT_MANAGER_CONTRACT,
      networkName,
    ),
    uniswapV3Staker: await getContractAddress(
      "uniswapV3Staker",
      UNISWAP_V3_STAKER_CONTRACT,
      networkName,
    ),
    usdcToken: await getContractAddress(
      "usdcToken",
      USDC_CONTRACT,
      networkName,
    ),
    wrappedNativeToken: await getContractAddress(
      "wrappedNativeToken",
      WRAPPED_NATIVE_TOKEN_CONTRACT,
      networkName,
    ),
    wrappedNativeUsdcPool: await getContractAddress(
      "wrappedNativeUsdcPool",
      WRAPPED_NATIVE_USDC_POOL_CONTRACT,
      networkName,
    ),
    wrappedNativeUsdcPoolFactory: await getContractAddress(
      "wrappedNativeUsdcPoolFactory",
      WRAPPED_NATIVE_USDC_POOL_FACTORY_CONTRACT,
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

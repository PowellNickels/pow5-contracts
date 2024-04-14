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

import { getAddressBook } from "../addresses/addressBook";
import { uniV3PoolFactoryAbi } from "../contracts/dapp";
import {
  uniswapV3FactoryAbi,
  uniswapV3NftDescriptorAbi,
  uniswapV3NftManagerAbi,
  uniswapV3PoolAbi,
  uniswapV3StakerAbi,
  wrappedNativeTokenAbi,
} from "../contracts/depends";
import {
  testErc1155EnumerableAbi,
  testLiquidityMathAbi,
  testTickMathAbi,
  usdcTokenAbi,
} from "../contracts/testing";
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
  const testErc1155EnumerableContract = new ethers.Contract(
    addressBook.testErc1155Enumerable!,
    testErc1155EnumerableAbi,
    beneficiary,
  );
  const testLiquidityMathContract = new ethers.Contract(
    addressBook.testLiquidityMath!,
    testLiquidityMathAbi,
    beneficiary,
  );
  const testTickMathContract = new ethers.Contract(
    addressBook.testTickMath!,
    testTickMathAbi,
    beneficiary,
  );
  const uniswapV3FactoryContract = new ethers.Contract(
    addressBook.uniswapV3Factory!,
    uniswapV3FactoryAbi,
    beneficiary,
  );
  const uniswapV3NftDescriptorContract = new ethers.Contract(
    addressBook.uniswapV3NftDescriptor!,
    uniswapV3NftDescriptorAbi,
    beneficiary,
  );
  const uniswapV3NftManagerContract = new ethers.Contract(
    addressBook.uniswapV3NftManager!,
    uniswapV3NftManagerAbi,
    beneficiary,
  );
  const uniswapV3StakerContract = new ethers.Contract(
    addressBook.uniswapV3Staker!,
    uniswapV3StakerAbi,
    beneficiary,
  );
  const usdcTokenContract = new ethers.Contract(
    addressBook.usdcToken!,
    usdcTokenAbi,
    beneficiary,
  );
  const wrappedNativeTokenContract = new ethers.Contract(
    addressBook.wrappedNativeToken!,
    wrappedNativeTokenAbi,
    beneficiary,
  );
  const wrappedNativeUsdcPoolContract = new ethers.Contract(
    addressBook.wrappedNativeUsdcPool!,
    uniswapV3PoolAbi,
    beneficiary,
  );
  const wrappedNativeUsdcPoolFactoryContract = new ethers.Contract(
    addressBook.wrappedNativeUsdcPoolFactory!,
    uniV3PoolFactoryAbi,
    beneficiary,
  );

  return {
    testErc1155EnumerableContract,
    testLiquidityMathContract,
    testTickMathContract,
    uniswapV3FactoryContract,
    uniswapV3NftDescriptorContract,
    uniswapV3NftManagerContract,
    uniswapV3StakerContract,
    usdcTokenContract,
    wrappedNativeTokenContract,
    wrappedNativeUsdcPoolContract,
    wrappedNativeUsdcPoolFactoryContract,
  };
}

export { setupFixture };

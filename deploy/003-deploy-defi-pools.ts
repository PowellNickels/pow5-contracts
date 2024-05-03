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
import { ContractTransactionResponse, ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  DeployFunction,
  DeployOptions,
  DeployResult,
} from "hardhat-deploy/types";
import { getUnnamedSigners } from "hardhat-deploy-ethers/dist/src/helpers";

import { UNI_V3_POOL_FACTORY_CONTRACT } from "../src/contracts/hardhat/dapp";
import { uniV3PoolFactoryAbi } from "../src/contracts/hardhat/dapp";
import {
  uniswapV3PoolAbi,
  WRAPPED_NATIVE_USDC_POOL_CONTRACT,
  WRAPPED_NATIVE_USDC_POOL_FACTORY_CONTRACT,
} from "../src/contracts/hardhat/depends";
import { AddressBook } from "../src/interfaces/addressBook";
import {
  USDC_ETH_LP_ETH_AMOUNT_BASE,
  USDC_ETH_LP_USDC_AMOUNT_BASE,
} from "../src/testing/defiMetrics";
import { UNI_V3_FEE_AMOUNT } from "../src/utils/constants";
import { encodePriceSqrt } from "../src/utils/fixedMath";
import { getAddressBook, writeAddress } from "../src/utils/getAddressBook";

//
// Deploy test token contracts
//

const func: DeployFunction = async (hardhat_re: HardhatRuntimeEnvironment) => {
  const { deployments } = hardhat_re;
  const { deploy } = deployments;

  // Get the deployer signer
  const signers: SignerWithAddress[] = await getUnnamedSigners(hardhat_re);
  const deployer: SignerWithAddress = signers[0];
  const deployerAddress: string = await deployer.getAddress();

  const opts: DeployOptions = {
    deterministicDeployment: true,
    from: deployerAddress,
    log: true,
  };

  // Get the network name
  const networkName: string = hardhat_re.network.name;

  // Get the contract addresses
  const addressBook: AddressBook = await getAddressBook(networkName);

  //////////////////////////////////////////////////////////////////////////////
  // Create WETH/USDC pool
  //////////////////////////////////////////////////////////////////////////////

  // Deploy Uniswap V3 pool factory
  console.log(`Deploying ${WRAPPED_NATIVE_USDC_POOL_FACTORY_CONTRACT}`);

  const wrappedNativeUsdcPoolFactoryReceipt: DeployResult = await deploy(
    WRAPPED_NATIVE_USDC_POOL_FACTORY_CONTRACT,
    {
      ...opts,
      contract: UNI_V3_POOL_FACTORY_CONTRACT,
      args: [
        addressBook.uniswapV3Factory!,
        addressBook.wrappedNativeToken!,
        addressBook.usdcToken!,
        UNI_V3_FEE_AMOUNT.LOW,
      ],
    },
  );

  addressBook.wrappedNativeUsdcPoolFactory =
    wrappedNativeUsdcPoolFactoryReceipt.address;

  // Read Uniswap V3 pool address
  const wrappedNativeUsdcPoolFactoryContract = new ethers.Contract(
    addressBook.wrappedNativeUsdcPoolFactory!,
    uniV3PoolFactoryAbi,
    deployer,
  );
  const wrappedNativeUsdcPoolAddress: string =
    await wrappedNativeUsdcPoolFactoryContract.uniswapV3Pool();
  addressBook.wrappedNativeUsdcPool = wrappedNativeUsdcPoolAddress;

  // Read token order
  const wrappedNativeUsdcPoolContract = new ethers.Contract(
    addressBook.wrappedNativeUsdcPool!,
    uniswapV3PoolAbi,
    deployer,
  );
  const token0: string = await wrappedNativeUsdcPoolContract.token0();
  const token1: string = await wrappedNativeUsdcPoolContract.token1();

  if (addressBook.wrappedNativeToken === token0) {
    console.log(`WETH is token0 (${addressBook.wrappedNativeToken})`);
    console.log(`USDC is token1 (${addressBook.usdcToken})`);
  } else if (addressBook.wrappedNativeToken === token1) {
    console.log(`WETH is token1 (${addressBook.wrappedNativeToken})`);
    console.log(`USDC is token0 (${addressBook.usdcToken})`);
  } else {
    // This should never happen, raise an exception
    throw new Error("ERROR: Neither token0 nor token1 is WETH!");
  }

  const wethIsToken0: boolean = addressBook.wrappedNativeToken === token0;

  //////////////////////////////////////////////////////////////////////////////
  // Initialize WETH/USDC pool
  //////////////////////////////////////////////////////////////////////////////

  // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
  let sqrtPriceX96: bigint;
  if (wethIsToken0) {
    sqrtPriceX96 = encodePriceSqrt(
      USDC_ETH_LP_USDC_AMOUNT_BASE,
      USDC_ETH_LP_ETH_AMOUNT_BASE,
    );
  } else {
    sqrtPriceX96 = encodePriceSqrt(
      USDC_ETH_LP_ETH_AMOUNT_BASE,
      USDC_ETH_LP_USDC_AMOUNT_BASE,
    );
  }

  // Initialize pool
  console.log(`Initializing ${WRAPPED_NATIVE_USDC_POOL_CONTRACT}`);
  const initializeTx: Promise<ContractTransactionResponse> =
    wrappedNativeUsdcPoolContract.initialize(sqrtPriceX96);

  // Failure is not fatal, pool may already have been initialized
  try {
    await (await initializeTx).wait();
  } catch (err) {
    console.log(`${WRAPPED_NATIVE_USDC_POOL_CONTRACT} is already initialized`);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Record addresses
  //////////////////////////////////////////////////////////////////////////////

  writeAddress(
    networkName,
    WRAPPED_NATIVE_USDC_POOL_FACTORY_CONTRACT,
    addressBook.wrappedNativeUsdcPoolFactory!,
    uniV3PoolFactoryAbi,
  );

  writeAddress(
    networkName,
    WRAPPED_NATIVE_USDC_POOL_CONTRACT,
    addressBook.wrappedNativeUsdcPool!,
    uniswapV3PoolAbi,
  );
};

export default func;
func.tags = ["LiquidityPools"];

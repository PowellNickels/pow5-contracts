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
  POW1_POOL_CONTRACT,
  POW1_POOL_FACTORY_CONTRACT,
  POW1_POOLER_CONTRACT,
  POW1_STAKER_CONTRACT,
  POW1_SWAPPER_CONTRACT,
  POW5_POOL_CONTRACT,
  POW5_POOL_FACTORY_CONTRACT,
  POW5_POOLER_CONTRACT,
  POW5_STAKER_CONTRACT,
  POW5_SWAPPER_CONTRACT,
  UNI_V3_POOL_FACTORY_CONTRACT,
  UNI_V3_POOLER_CONTRACT,
  UNI_V3_STAKER_CONTRACT,
  UNI_V3_SWAPPER_CONTRACT,
} from "../src/hardhat/contracts/dapp";
import { uniswapV3PoolAbi } from "../src/hardhat/contracts/depends";
import { getAddressBook, writeAddress } from "../src/hardhat/getAddressBook";
import { AddressBook } from "../src/interfaces/addressBook";
import { LPPOW1_POOL_FEE, LPPOW5_POOL_FEE } from "../src/utils/constants";

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
  // Deploy POW1 contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy Uniswap V3 pool factory for POW1
  //

  console.log(`Deploying ${POW1_POOL_FACTORY_CONTRACT}`);
  const pow1PoolFactoryTx = await deployments.deploy(
    POW1_POOL_FACTORY_CONTRACT,
    {
      ...opts,
      contract: UNI_V3_POOL_FACTORY_CONTRACT,
      args: [
        addressBook.uniswapV3Factory!, // factory
        addressBook.pow1Token!, // gameToken
        addressBook.wrappedNativeToken!, // assetToken
        LPPOW1_POOL_FEE, // swapFee
      ],
    },
  );
  addressBook.pow1PoolFactory = pow1PoolFactoryTx.address;

  //
  // Read Uniswap V3 pool address for POW1
  //

  addressBook.pow1Pool = await deployments.read(
    POW1_POOL_FACTORY_CONTRACT,
    "uniswapV3Pool",
  );

  //
  // Deploy UniV3Swapper for POW1
  //

  console.log(`Deploying ${POW1_SWAPPER_CONTRACT}`);
  const pow1SwapperTx = await deployments.deploy(POW1_SWAPPER_CONTRACT, {
    ...opts,
    contract: UNI_V3_SWAPPER_CONTRACT,
    args: [
      addressBook.pow1Pool!, // uniswapV3Pool
      addressBook.pow1Token!, // gameToken
      addressBook.wrappedNativeToken!, // assetToken
    ],
  });
  addressBook.pow1Swapper = pow1SwapperTx.address;

  //
  // Deploy UniV3Pooler for POW1
  //

  console.log(`Deploying ${POW1_POOLER_CONTRACT}`);
  const pow1PoolerTx = await deployments.deploy(POW1_POOLER_CONTRACT, {
    ...opts,
    contract: UNI_V3_POOLER_CONTRACT,
    args: [
      addressBook.pow1Swapper!, // uniV3Swapper
      addressBook.uniswapV3NftManager!, // uniswapV3NftManager
    ],
  });
  addressBook.pow1Pooler = pow1PoolerTx.address;

  //
  // Deploy UniV3Staker for POW1
  //

  console.log(`Deploying ${POW1_STAKER_CONTRACT}`);
  const pow1StakerTx = await deployments.deploy(POW1_STAKER_CONTRACT, {
    ...opts,
    contract: UNI_V3_STAKER_CONTRACT,
    args: [
      deployer, // owner
      addressBook.pow1Pooler!, // uniV3Pooler
      addressBook.uniswapV3Staker!, // uniswapV3Staker
      addressBook.lpSft!, // lpSft
      addressBook.pow1Token!, // rewardToken
    ],
  });
  addressBook.pow1Staker = pow1StakerTx.address;

  //////////////////////////////////////////////////////////////////////////////
  // Deploy POW5 contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy Uniswap V3 pool factory for POW5
  //

  console.log(`Deploying ${POW5_POOL_FACTORY_CONTRACT}`);
  const pow5PoolFactoryTx = await deployments.deploy(
    POW5_POOL_FACTORY_CONTRACT,
    {
      ...opts,
      contract: UNI_V3_POOL_FACTORY_CONTRACT,
      args: [
        addressBook.uniswapV3Factory!, // factory
        addressBook.pow5Token!, // gameToken
        addressBook.usdcToken!, // assetToken
        LPPOW5_POOL_FEE, // swapFee
      ],
    },
  );
  addressBook.pow5PoolFactory = pow5PoolFactoryTx.address;

  //
  // Read Uniswap V3 pool address for POW5
  //

  addressBook.pow5Pool = await deployments.read(
    POW5_POOL_FACTORY_CONTRACT,
    "uniswapV3Pool",
  );

  //
  // Deploy UniV3Swapper for POW5
  //

  console.log(`Deploying ${POW5_SWAPPER_CONTRACT}`);
  const pow5SwapperTx = await deployments.deploy(POW5_SWAPPER_CONTRACT, {
    ...opts,
    contract: UNI_V3_SWAPPER_CONTRACT,
    args: [
      addressBook.pow5Pool!, // uniswapV3Pool
      addressBook.pow5Token!, // gameToken
      addressBook.usdcToken!, // assetToken
    ],
  });
  addressBook.pow5Swapper = pow5SwapperTx.address;

  //
  // Deploy UniV3Pooler for POW5
  //

  console.log(`Deploying ${POW5_POOLER_CONTRACT}`);
  const pow5PoolerTx = await deployments.deploy(POW5_POOLER_CONTRACT, {
    ...opts,
    contract: UNI_V3_POOLER_CONTRACT,
    args: [
      addressBook.pow5Swapper!, // uniV3Swapper
      addressBook.uniswapV3NftManager!, // uniswapV3NftManager
    ],
  });
  addressBook.pow5Pooler = pow5PoolerTx.address;

  //
  // Deploy UniV3Staker for POW5
  //

  console.log(`Deploying ${POW5_STAKER_CONTRACT}`);
  const pow5StakerTx = await deployments.deploy(POW5_STAKER_CONTRACT, {
    ...opts,
    contract: UNI_V3_STAKER_CONTRACT,
    args: [
      deployer, // owner
      addressBook.pow5Pooler!, // uniV3Pooler
      addressBook.uniswapV3Staker!, // uniswapV3Staker
      addressBook.lpSft!, // lpSft
      addressBook.pow1Token!, // rewardToken
    ],
  });
  addressBook.pow5Staker = pow5StakerTx.address;

  //////////////////////////////////////////////////////////////////////////////
  // Record addresses
  //////////////////////////////////////////////////////////////////////////////

  writeAddress(
    networkName,
    POW1_POOL_CONTRACT,
    addressBook.pow1Pool!,
    uniswapV3PoolAbi,
  );
  writeAddress(
    networkName,
    POW5_POOL_CONTRACT,
    addressBook.pow5Pool!,
    uniswapV3PoolAbi,
  );
};

export default func;
func.tags = ["POWPools"];

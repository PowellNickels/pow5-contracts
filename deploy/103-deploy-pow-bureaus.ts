/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";

import {
  DUTCH_AUCTION_CONTRACT,
  LIQUIDITY_FORGE_CONTRACT,
  REVERSE_REPO_CONTRACT,
  YIELD_HARVEST_CONTRACT,
} from "../src/hardhat/contracts/dapp";
import { getAddressBook } from "../src/hardhat/getAddressBook";
import { AddressBook } from "../src/interfaces/addressBook";

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
  // Deploy DeFi contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy DutchAuction
  //

  if (addressBook.dutchAuction) {
    console.log(
      `Using ${DUTCH_AUCTION_CONTRACT} at ${addressBook.dutchAuction}`,
    );
  } else {
    console.log(`Deploying ${DUTCH_AUCTION_CONTRACT}`);
    const dutchAuctionTx = await deployments.deploy(DUTCH_AUCTION_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
        addressBook.pow1Token!, // gameToken
        addressBook.wrappedNativeToken!, // assetToken
        addressBook.lpSft!, // lpSft
        addressBook.pow1Pooler!, // uniV3Pooler
        addressBook.pow1Swapper!, // uniV3Swapper
        addressBook.pow1LpNftStakeFarm!, // lpNftStakeFarm
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
        addressBook.pow1Pool!, // uniswapV3Pool
      ],
    });
    addressBook.dutchAuction = dutchAuctionTx.address;
  }

  //
  // Deploy YieldHarvest
  //

  if (addressBook.yieldHarvest) {
    console.log(
      `Using ${YIELD_HARVEST_CONTRACT} at ${addressBook.yieldHarvest}`,
    );
  } else {
    console.log(`Deploying ${YIELD_HARVEST_CONTRACT}`);
    const yieldHarvestTx = await deployments.deploy(YIELD_HARVEST_CONTRACT, {
      ...opts,
      args: [
        addressBook.lpSft!, // lpSft
        addressBook.noLpSft!, // noLpSft
        addressBook.pow1LpSftLendFarm!, // lpSftLendFarm
        addressBook.defiManager!, // defiManager
      ],
    });
    addressBook.yieldHarvest = yieldHarvestTx.address;
  }

  //
  // Deploy LiquidityForge
  //

  if (addressBook.liquidityForge) {
    console.log(
      `Using ${LIQUIDITY_FORGE_CONTRACT} at ${addressBook.liquidityForge}`,
    );
  } else {
    console.log(`Deploying ${LIQUIDITY_FORGE_CONTRACT}`);
    const liquidityForgeTx = await deployments.deploy(
      LIQUIDITY_FORGE_CONTRACT,
      {
        ...opts,
        args: [
          addressBook.lpSft!, // lpSft
          addressBook.noLpSft!, // noLpSft
          addressBook.defiManager!, // defiManager
          addressBook.pow5Token!, // pow5
          addressBook.yieldHarvest!, // yieldHarvest
          addressBook.pow5InterestFarm!, // erc20InterestFarm
        ],
      },
    );
    addressBook.liquidityForge = liquidityForgeTx.address;
  }

  //
  // Deploy ReverseRepo
  //

  if (addressBook.reverseRepo) {
    console.log(`Using ${REVERSE_REPO_CONTRACT} at ${addressBook.reverseRepo}`);
  } else {
    console.log(`Deploying ${REVERSE_REPO_CONTRACT}`);
    const reverseRepoTx = await deployments.deploy(REVERSE_REPO_CONTRACT, {
      ...opts,
      args: [
        deployer, // owner
        addressBook.pow5Token!, // gameToken
        addressBook.usdcToken!, // assetToken
        addressBook.lpSft!, // lpSft
        addressBook.pow5Pooler!, // uniV3Pooler
        addressBook.pow5Swapper!, // uniV3Swapper
        addressBook.pow5LpNftStakeFarm!, // uniV3StakeFarm
        addressBook.uniswapV3NftManager!, // uniswapV3NftManager
        addressBook.pow5Pool!, // uniswapV3Pool
      ],
    });
    addressBook.reverseRepo = reverseRepoTx.address;
  }
};

export default func;
func.tags = ["POWBureaus"];

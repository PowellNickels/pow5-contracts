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
  THE_RESERVE_CONTRACT,
  YIELD_HARVEST_CONTRACT,
} from "../src/hardhat/contracts/dapp";
import { getAddressBook } from "../src/hardhat/getAddressBook";
import { getNetworkName } from "../src/hardhat/hardhatUtils";
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
  const networkName: string = getNetworkName();

  // Get the contract addresses
  const addressBook: AddressBook = await getAddressBook(networkName);

  //////////////////////////////////////////////////////////////////////////////
  // Deploy bureaucracy contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy TheReserve
  //

  console.log(`Deploying ${THE_RESERVE_CONTRACT}`);
  const theReserveTx = await deployments.deploy(THE_RESERVE_CONTRACT, {
    ...opts,
    args: [
      {
        pow1Token: addressBook.pow1Token!,
        pow5Token: addressBook.pow5Token!,
        lpPow1Token: addressBook.lpPow1Token!,
        lpPow5Token: addressBook.lpPow5Token!,
        noPow5Token: addressBook.noPow5Token!,
        marketToken: addressBook.wrappedNativeToken!,
        stableToken: addressBook.usdcToken!,
        pow1MarketPool: addressBook.pow1MarketPool!,
        pow1MarketSwapper: addressBook.pow1MarketSwapper!,
        pow1MarketPooler: addressBook.pow1MarketPooler!,
        pow1LpNftStakeFarm: addressBook.pow1LpNftStakeFarm!,
        pow5StablePool: addressBook.pow5StablePool!,
        pow5StableSwapper: addressBook.pow5StableSwapper!,
        pow5StablePooler: addressBook.pow5StablePooler!,
        pow5LpNftStakeFarm: addressBook.pow5LpNftStakeFarm!,
        marketStablePool: addressBook.wrappedNativeUsdcPool!,
        marketStableSwapper: addressBook.wrappedNativeUsdcSwapper!,
        lpSft: addressBook.lpSft!,
        uniswapV3Factory: addressBook.uniswapV3Factory!,
        uniswapV3NftManager: addressBook.uniswapV3NftManager!,
      },
    ],
  });
  addressBook.theReserve = theReserveTx.address as `0x${string}`;

  //
  // Deploy DutchAuction
  //

  console.log(`Deploying ${DUTCH_AUCTION_CONTRACT}`);
  const dutchAuctionTx = await deployments.deploy(DUTCH_AUCTION_CONTRACT, {
    ...opts,
    args: [
      deployer, // owner
      addressBook.theReserve!, // theReserve
    ],
  });
  addressBook.dutchAuction = dutchAuctionTx.address as `0x${string}`;

  //
  // Deploy YieldHarvest
  //

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
  addressBook.yieldHarvest = yieldHarvestTx.address as `0x${string}`;

  //
  // Deploy LiquidityForge
  //

  console.log(`Deploying ${LIQUIDITY_FORGE_CONTRACT}`);
  const liquidityForgeTx = await deployments.deploy(LIQUIDITY_FORGE_CONTRACT, {
    ...opts,
    args: [
      addressBook.lpSft!, // lpSft
      addressBook.noLpSft!, // noLpSft
      addressBook.defiManager!, // defiManager
      addressBook.pow5Token!, // pow5
      addressBook.yieldHarvest!, // yieldHarvest
      addressBook.pow5InterestFarm!, // erc20InterestFarm
    ],
  });
  addressBook.liquidityForge = liquidityForgeTx.address as `0x${string}`;

  //
  // Deploy ReverseRepo
  //

  console.log(`Deploying ${REVERSE_REPO_CONTRACT}`);
  const reverseRepoTx = await deployments.deploy(REVERSE_REPO_CONTRACT, {
    ...opts,
    args: [
      deployer, // owner
      addressBook.pow5Token!, // pow5Token
      addressBook.usdcToken!, // stableToken
      addressBook.pow5StablePool!, // pow5StablePool
      addressBook.pow5StableSwapper!, // pow5StableSwapper
      addressBook.pow5StablePooler!, // pow5StablePooler
      addressBook.pow5LpNftStakeFarm!, // pow5LpNftStakeFarm
      addressBook.lpSft!, // lpSft
      addressBook.uniswapV3NftManager!, // uniswapV3NftManager
    ],
  });
  addressBook.reverseRepo = reverseRepoTx.address as `0x${string}`;
};

export default func;
func.tags = ["POWBureaucracy"];

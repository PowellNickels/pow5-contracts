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

import { ethers } from "ethers";

import { AddressBook } from "../interfaces/addressBook";
import { DutchAuctionContract } from "../interfaces/bureaucracy/dutchAuction/dutchAuctionContract";
import { LiquidityForgeContract } from "../interfaces/bureaucracy/liquidityForgeContract";
import { ReverseRepoContract } from "../interfaces/bureaucracy/reverseRepoContract";
import { TheReserveContract } from "../interfaces/bureaucracy/theReserve/theReserveContract";
import { YieldHarvestContract } from "../interfaces/bureaucracy/yieldHarvest/yieldHarvestContract";
import { ContractLibrary } from "../interfaces/contractLibrary";
import { DeFiManagerContract } from "../interfaces/defi/defiManagerContract";
import { POW1LpNftStakeFarmContract } from "../interfaces/defi/pow1LpNftStakeFarmContract";
import { POW1LpSftLendFarmContract } from "../interfaces/defi/pow1LpSftLendFarmContract";
import { POW5InterestFarmContract } from "../interfaces/defi/pow5InterestFarmContract";
import { POW5LpNftStakeFarmContract } from "../interfaces/defi/pow5LpNftStakeFarmContract";
import { POW5LpSftLendFarmContract } from "../interfaces/defi/pow5LpSftLendFarmContract";
import { LPPOW1Contract } from "../interfaces/token/erc20/lpPow1Contract";
import { LPPOW5Contract } from "../interfaces/token/erc20/lpPow5Contract";
import { NOPOW5Contract } from "../interfaces/token/erc20/noPow5Contract";
import { POW1Contract } from "../interfaces/token/erc20/pow1Contract";
import { POW5Contract } from "../interfaces/token/erc20/pow5Contract";
import { WrappedNativeContract } from "../interfaces/token/erc20/wrappedNativeContract";
import { LPSFTContract } from "../interfaces/token/erc1155/lpSftContract";
import { NOLPSFTContract } from "../interfaces/token/erc1155/noLpSftContract";
import { MarketStableSwapperContract } from "../interfaces/token/routes/marketStableSwapperContract";
import { POW1MarketPoolerContract } from "../interfaces/token/routes/pow1MarketPoolerContract";
import { POW1MarketSwapperContract } from "../interfaces/token/routes/pow1MarketSwapperContract";
import { POW5StablePoolerContract } from "../interfaces/token/routes/pow5StablePoolerContract";
import { POW5StableSwapperContract } from "../interfaces/token/routes/pow5StableSwapperContract";
import { UniswapV3PoolContract } from "../interfaces/uniswap/pool/uniswapV3PoolContract";
import { UniswapV3FactoryContract } from "../interfaces/uniswap/uniswapV3FactoryContract";
import { ERC20Contract } from "../interfaces/zeppelin/token/erc20/erc20Contract";

//
// Utility functions
//

function getContractLibrary(
  signer: ethers.Signer,
  addressBook: AddressBook,
): ContractLibrary {
  return {
    defiManagerContract: new DeFiManagerContract(
      signer,
      addressBook.defiManager!,
    ),
    dutchAuctionContract: new DutchAuctionContract(
      signer,
      addressBook.dutchAuction!,
    ),
    liquidityForgeContract: new LiquidityForgeContract(
      signer,
      addressBook.liquidityForge!,
    ),
    lpPow1Contract: new LPPOW1Contract(signer, addressBook.lpPow1Token!),
    lpPow5Contract: new LPPOW5Contract(signer, addressBook.lpPow5Token!),
    lpSftContract: new LPSFTContract(signer, addressBook.lpSft!),
    noLpSftContract: new NOLPSFTContract(signer, addressBook.noLpSft!),
    noPow5Contract: new NOPOW5Contract(signer, addressBook.noPow5Token!),
    pow1Contract: new POW1Contract(signer, addressBook.pow1Token!),
    pow1LpNftStakeFarmContract: new POW1LpNftStakeFarmContract(
      signer,
      addressBook.pow1LpNftStakeFarm!,
    ),
    pow1LpSftLendFarmContract: new POW1LpSftLendFarmContract(
      signer,
      addressBook.pow1LpSftLendFarm!,
    ),
    pow1MarketPoolContract: new UniswapV3PoolContract(
      signer,
      addressBook.pow1MarketPool!,
    ),
    pow1MarketPoolerContract: new POW1MarketPoolerContract(
      signer,
      addressBook.pow1MarketPooler!,
    ),
    pow1MarketSwapperContract: new POW1MarketSwapperContract(
      signer,
      addressBook.pow1MarketSwapper!,
    ),
    pow5Contract: new POW5Contract(signer, addressBook.pow5Token!),
    pow5InterestFarmContract: new POW5InterestFarmContract(
      signer,
      addressBook.pow5InterestFarm!,
    ),
    pow5LpNftStakeFarmContract: new POW5LpNftStakeFarmContract(
      signer,
      addressBook.pow5LpNftStakeFarm!,
    ),
    pow5LpSftLendFarmContract: new POW5LpSftLendFarmContract(
      signer,
      addressBook.pow5LpSftLendFarm!,
    ),
    pow5StablePoolContract: new UniswapV3PoolContract(
      signer,
      addressBook.pow5StablePool!,
    ),
    pow5StablePoolerContract: new POW5StablePoolerContract(
      signer,
      addressBook.pow5StablePooler!,
    ),
    pow5StableSwapperContract: new POW5StableSwapperContract(
      signer,
      addressBook.pow5StableSwapper!,
    ),
    reverseRepoContract: new ReverseRepoContract(
      signer,
      addressBook.reverseRepo!,
    ),
    theReserveContract: new TheReserveContract(signer, addressBook.theReserve!),
    uniswapV3FactoryContract: new UniswapV3FactoryContract(
      signer,
      addressBook.uniswapV3Factory!,
    ),
    usdcContract: new ERC20Contract(signer, addressBook.usdcToken!),
    wrappedNativeContract: new WrappedNativeContract(
      signer,
      addressBook.wrappedNativeToken!,
    ),
    wrappedNativeUsdcPoolContract: new UniswapV3PoolContract(
      signer,
      addressBook.wrappedNativeUsdcPool!,
    ),
    wrappedNativeUsdcSwapperContract: new MarketStableSwapperContract(
      signer,
      addressBook.wrappedNativeUsdcSwapper!,
    ),
    yieldHarvestContract: new YieldHarvestContract(
      signer,
      addressBook.yieldHarvest!,
    ),
  };
}

export { getContractLibrary };

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

/**
 * @description Address book interface
 */
interface AddressBook {
  defiManager?: string;
  dutchAuction?: string;
  liquidityForge?: string;
  lpNft?: string;
  lpPow1Token?: string;
  lpPow5Token?: string;
  lpSft?: string;
  noLpSft?: string;
  noPow5Token?: string;
  pow1LpNftStakeFarm?: string;
  pow1LpSftLendFarm?: string;
  pow1Pool?: string;
  pow1Pooler?: string;
  pow1PoolFactory?: string;
  pow1Staker?: string;
  pow1Swapper?: string;
  pow1Token?: string;
  pow5InterestFarm?: string;
  pow5LpNftStakeFarm?: string;
  pow5LpSftLendFarm?: string;
  pow5Pool?: string;
  pow5Pooler?: string;
  pow5PoolFactory?: string;
  pow5Staker?: string;
  pow5Swapper?: string;
  pow5Token?: string;
  reverseRepo?: string;
  testErc1155Enumerable?: string;
  testLiquidityMath?: string;
  testPow5InterestFarm?: string;
  testRewardMath?: string;
  testStringUtils?: string;
  testTickMath?: string;
  uniswapV3Factory?: string;
  uniswapV3NftDescriptor?: string;
  uniswapV3NftManager?: string;
  uniswapV3Staker?: string;
  usdcToken?: string;
  wrappedNativeToken?: string;
  wrappedNativeUsdcPool?: string;
  wrappedNativeUsdcPoolFactory?: string;
  yieldHarvest?: string;
}

export { AddressBook };

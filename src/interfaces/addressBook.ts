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
  defiManager?: `0x${string}`;
  dutchAuction?: `0x${string}`;
  liquidityForge?: `0x${string}`;
  lpNft?: `0x${string}`;
  lpPow1Token?: `0x${string}`;
  lpPow5Token?: `0x${string}`;
  lpSft?: `0x${string}`;
  noLpSft?: `0x${string}`;
  noPow5Token?: `0x${string}`;
  pow1LpNftStakeFarm?: `0x${string}`;
  pow1LpSftLendFarm?: `0x${string}`;
  pow1Pool?: `0x${string}`;
  pow1Pooler?: `0x${string}`;
  pow1PoolFactory?: `0x${string}`;
  pow1Staker?: `0x${string}`;
  pow1Swapper?: `0x${string}`;
  pow1Token?: `0x${string}`;
  pow5InterestFarm?: `0x${string}`;
  pow5LpNftStakeFarm?: `0x${string}`;
  pow5LpSftLendFarm?: `0x${string}`;
  pow5Pool?: `0x${string}`;
  pow5Pooler?: `0x${string}`;
  pow5PoolFactory?: `0x${string}`;
  pow5Staker?: `0x${string}`;
  pow5Swapper?: `0x${string}`;
  pow5Token?: `0x${string}`;
  reverseRepo?: `0x${string}`;
  testErc1155Enumerable?: `0x${string}`;
  testLiquidityMath?: `0x${string}`;
  testPow5InterestFarm?: `0x${string}`;
  testRewardMath?: `0x${string}`;
  testStringUtils?: `0x${string}`;
  testTickMath?: `0x${string}`;
  uniswapV3Factory?: `0x${string}`;
  uniswapV3NftDescriptor?: `0x${string}`;
  uniswapV3NftManager?: `0x${string}`;
  uniswapV3Staker?: `0x${string}`;
  usdcToken?: `0x${string}`;
  wrappedNativeToken?: `0x${string}`;
  wrappedNativeUsdcPool?: `0x${string}`;
  wrappedNativeUsdcPoolFactory?: `0x${string}`;
  yieldHarvest?: `0x${string}`;
}

export { AddressBook };

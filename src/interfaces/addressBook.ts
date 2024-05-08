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
  testErc1155Enumerable?: string;
  testLiquidityMath?: string;
  testTickMath?: string;
  uniswapV3Factory?: string;
  uniswapV3NftDescriptor?: string;
  uniswapV3NftManager?: string;
  uniswapV3Staker?: string;
  usdcToken?: string;
  wrappedNativeToken?: string;
  wrappedNativeUsdcPool?: string;
  wrappedNativeUsdcPoolFactory?: string;
}

export { AddressBook };

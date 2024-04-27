/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * This file is derived from the Uniswap V3 project after the BSL lapsed into
 * the GPL v2 license on 2023/04/01.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0 AND GPL-2.0-or-later
 * See the file LICENSE.txt for more information.
 */

/*
 * Constants
 */

////////////////////////////////////////////////////////////////////////////////
// Token constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @description The decimal count for POW1
 */
const POW1_DECIMALS: number = 18;

/**
 * @description The decimal count for POW5
 */
const POW5_DECIMALS: number = 12;

/**
 * @description The decimal count for LPPOW1
 */
const LPPOW1_DECIMALS: number = 15;

/**
 * @description The decimal count for LPPOW5
 */
const LPPOW5_DECIMALS: number = 12;

////////////////////////////////////////////////////////////////////////////////
// Uniswap constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @description Represents the minimum tick value for Uniswap pools
 *
 * Computed from log base 1.0001 of 2**-128.
 */
const MIN_TICK: number = -887272;

/**
 * @description Represents the maximum tick value for Uniswap pools
 *
 * Computed from log base 1.0001 of 2**128.
 */
const MAX_TICK: number = 887272;

/**
 * @description Represents the minimum square root ratio of token prices in
 * Uniswap pools
 *
 * Equivalent to getSqrtRatioAtTick(MIN_TICK).
 */
const MIN_SQRT_RATIO: bigint = 4295128739n;

/**
 * @description Represents the maximum square root ratio of token prices in
 * Uniswap pools
 *
 * Equivalent to getSqrtRatioAtTick(MAX_TICK).
 */
const MAX_SQRT_RATIO: bigint =
  1461446703485210103287273052203988822378723970342n;

/**
 * @description The fee amount for Uniswap V3 pools, in hundredths of a bip
 */
const enum UNI_V3_FEE_AMOUNT {
  LOW = 500, // 0.05%
  MEDIUM = 3_000, // 0.3%
  HIGH = 10_000, // 1%
}

/**
 * @description The tick spacings for Uniswap V3 pools
 */
const TICK_SPACINGS: { [amount in UNI_V3_FEE_AMOUNT]: number } = {
  [UNI_V3_FEE_AMOUNT.LOW]: 10,
  [UNI_V3_FEE_AMOUNT.MEDIUM]: 60,
  [UNI_V3_FEE_AMOUNT.HIGH]: 200,
};

////////////////////////////////////////////////////////////////////////////////
// Utility constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @description The zero or absent address
 */
const ZERO_ADDRESS: string = "0x0000000000000000000000000000000000000000";

////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////

export {
  LPPOW1_DECIMALS,
  LPPOW5_DECIMALS,
  MAX_SQRT_RATIO,
  MAX_TICK,
  MIN_SQRT_RATIO,
  MIN_TICK,
  POW1_DECIMALS,
  POW5_DECIMALS,
  TICK_SPACINGS,
  UNI_V3_FEE_AMOUNT,
  ZERO_ADDRESS,
};

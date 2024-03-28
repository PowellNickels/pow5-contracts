/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0
 * See the file LICENSE.txt for more information.
 */

/*
 * Constants
 */

////////////////////////////////////////////////////////////////////////////////
// Uniswap constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @dev The fee amount for Uniswap V3 pools
 */
const enum UNI_V3_FEE_AMOUNT {
  LOW = 500, // 0.05%
  MEDIUM = 3_000, // 0.3%
  HIGH = 10_000, // 1%
}

/**
 * @dev The tick spacings for Uniswap V3 pools
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
 * @dev The zero or absent address
 */
const ZERO_ADDRESS: string = "0x0000000000000000000000000000000000000000";

////////////////////////////////////////////////////////////////////////////////
// Exports
////////////////////////////////////////////////////////////////////////////////

export { TICK_SPACINGS, UNI_V3_FEE_AMOUNT, ZERO_ADDRESS };

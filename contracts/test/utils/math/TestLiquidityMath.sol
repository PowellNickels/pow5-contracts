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

pragma solidity 0.8.27;

import "../../../src/utils/math/LiquidityMath.sol";

/**
 * @dev Contract wrapper for testing liquidity math
 */
contract TestLiquidityMath {
  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  LiquidityMath public liquidityMath;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  constructor() {
    // Initialize state
    liquidityMath = new LiquidityMath();
  }

  //////////////////////////////////////////////////////////////////////////////
  // External interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Compute the amount of token A to swap for token B
   *
   * @param reserveA The reserve of token A
   * @param amountA The amount of token A to add
   * @param swapFee The swap fee of the pool, denominated in hundredths of a bip
   */
  function testComputeSwapAmountV2(
    uint256 reserveA,
    uint256 amountA,
    uint24 swapFee
  ) external view returns (uint256) {
    return liquidityMath.computeSwapAmountV2(reserveA, amountA, swapFee);
  }
}

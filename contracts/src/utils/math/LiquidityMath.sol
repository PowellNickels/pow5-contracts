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

pragma solidity 0.8.28;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @dev Liquidity math for computing the optimal one-sided supply to a
 * liquidity pool
 */
library LiquidityMath {
  /**
   * @dev Compute swap amount needed for adding liquidity to a pool in the
   * absence of concentrated liquidity (such as a Uniswap V2 pool)
   *
   * The goal is to find the optimal swapA to get a corresponding amount
   * of asset B, so that the proportion of assets the user holds is equal to
   * the proportion of assets in reserves after swap.
   *
   * Calculation:
   *
   * The initial constant product is given by:
   *
   *   k = reserveA * reserveB
   *
   * The swap fee is deducted from the input asset amount, so the new reserveB
   * should satisfy:
   *
   *   k = (reserveA + (1 - fee) * swapA) * reserveB'
   *
   * This means the user will receive an amount of asset B equal to:
   *
   *   rcvB = reserveB - reserveB'
   *
   *        = reserveB - k / (reserveA + (1 - fee) * swapA)
   *
   *        = reserveB - reserveA * reserveB / (reserveA + (1 - fee) * swapA)
   *
   *        = (1 - fee) * reserveB * swapA / (reserveA + (1 - fee) * swapA)
   *
   * The optimal swapA should satisfy the equality constraint on the
   * user's asset ratio and the reserve's asset ratio:
   *
   *   (amountA - swapA) / (reserveA + swapA) = rcvB / reserveB'
   *
   * Substituting known variables rcvB and reserveB' and rearranging the
   * equation yields a quadratic equation in variable swapA as follows:
   *
   *   (1 - fee) * (swapA)^2 + ((2 - fee) * reserveA) * swapA - amountA * reserveA = 0
   *
   * Solving the above equation for a non-negative root yields:
   *
   *   swapA =
   *     sqrt(((2 - fee) * reserveA)^2 + 4 * (1 - fee) * amountA * reserveA) - (2 - fee) * reserveA
   *       / (2 * (1 - fee))
   *
   * The fee is represented in hundredths of a bip, so we can avoid floating
   * point numbers by multiplying both the numerator and denominator by 1E6:
   *
   * swapA =
   *   sqrt((2E6 - fee)^2 * reserveA^2 + 4 * 1E6 * (1E6 - fee) * amountA * reserveA) - (2E6 - fee) * reserveA
   *     / (2 * (1E6 - fee))
   *
   * Credit to Zapper Finance for the above derivation.
   *
   * @param reserveA The reserve of token A
   * @param amountA The amount of token A to add
   * @param swapfee The swap fee of the pool, denominated in hundredths of a bip
   *
   * @return swapA The amount of token A to swap for token B
   */
  function computeSwapAmountV2(
    uint256 reserveA,
    uint256 amountA,
    uint24 swapfee
  ) internal pure returns (uint256 swapA) {
    // prettier-ignore
    swapA = (
      Math.sqrt(
        (
          (uint256(2E6) - swapfee) * (uint256(2E6) - swapfee) * reserveA * reserveA
        ) + (
          uint256(4) * uint256(1E6) * (uint256(1E6) - swapfee) * amountA * reserveA
        )
      ) - (
        (uint256(2E6) - swapfee) * reserveA
      )
    ) / (
      uint256(2) * (uint256(1E6) - swapfee)
    );

    return swapA;
  }
}

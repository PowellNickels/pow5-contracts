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

/**
 * @dev Token router to swap between the market token and the stable token
 */
interface IDexTokenSwapper {
  //////////////////////////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Emitted when the market token is purchased for the stable token
   *
   * @param sender The sender of the stable token
   * @param recipient The address of the recipient of the market token
   * @param stableTokenAmount The amount of the stable token being spent
   * @param marketTokenReturned The amount of the market token received
   */
  event MarketTokenBought(
    address indexed sender,
    address indexed recipient,
    uint256 stableTokenAmount,
    uint256 marketTokenReturned
  );

  /**
   * @dev Emitted when the market token is sold for the stable token
   *
   * @param sender The sender of the market token
   * @param recipient The address of the recipient of the stable token
   * @param marketTokenAmount The amount of the market token spent
   * @param stableTokenReturned The amount of the stable token received
   */
  event MarketTokenSold(
    address indexed sender,
    address indexed recipient,
    uint256 marketTokenAmount,
    uint256 stableTokenReturned
  );

  //////////////////////////////////////////////////////////////////////////////
  // External interface for swapping into the market token
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Swaps the stable token for the market token
   *
   * @param stableTokenAmount The ammount of the stable token to include in
   *        the swap
   * @param recipient The receiver of the market token
   *
   * @return marketTokenReturned The amount of the market token returned to the
   * recipient
   */
  function buyMarketToken(
    uint256 stableTokenAmount,
    address recipient
  ) external returns (uint256 marketTokenReturned);

  //////////////////////////////////////////////////////////////////////////////
  // External interface for swapping out of the market token
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Swaps the market token for the stable token
   *
   * @param marketTokenAmount The amount of the market token to swap
   * @param recipient The recient of the stable token
   *
   * @return stableTokenReturned The amount of stable token sent to the
   * recipient
   */
  function sellMarketToken(
    uint256 marketTokenAmount,
    address recipient
  ) external returns (uint256 stableTokenReturned);

  /**
   * @dev Liquidate everything to the stable token in one function call
   *
   * @return stableTokenReturned The amount of stable token returned
   */
  function exit() external returns (uint256 stableTokenReturned);
}

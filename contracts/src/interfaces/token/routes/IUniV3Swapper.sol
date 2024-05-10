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

pragma solidity 0.8.25;

/**
 * @dev Token router to swap between the game token and a yielding asset token
 */
abstract contract IUniV3Swapper {
  //////////////////////////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Emitted when the game token is purchased for the asset token on
   *      Uniswap
   *
   * @param sender The sender of the asset token
   * @param recipient The address of the recipient of the game token
   * @param assetTokenAmount The amount of the asset token being spent
   * @param gameTokenReturned The amount of the game token received
   */
  event GameTokenBought(
    address indexed sender,
    address indexed recipient,
    uint256 assetTokenAmount,
    uint256 gameTokenReturned
  );

  /**
   * @dev Emitted when the game token is sold on Uniswap for the asset token
   *
   * @param sender The sender of the game token
   * @param recipient The address of the recipient of the asset token
   * @param gameTokenAmount The amount of the game token spent
   * @param assetTokenReturned The amount of the asset token returned to the
   *                           recipient
   */
  event GameTokenSold(
    address indexed sender,
    address indexed recipient,
    uint256 gameTokenAmount,
    uint256 assetTokenReturned
  );

  //////////////////////////////////////////////////////////////////////////////
  // External interface for swapping into the game token
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Swaps the asset token for the game token
   *
   * @param assetTokenAmount The ammount of the asset token to include in the swap
   * @param recipient The receiver of the game token
   *
   * @return gameTokenReturned The amount of the game token returned to the recipient
   */
  function buyGameToken(
    uint256 assetTokenAmount,
    address recipient
  ) external virtual returns (uint256 gameTokenReturned);

  //////////////////////////////////////////////////////////////////////////////
  // External interface for swapping out of the game token
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Swaps the game token for the asset token
   *
   * @param gameTokenAmount The amount of the game token to swap
   * @param recipient The recient of the asset token
   *
   * @return assetTokenReturned The amount of asset token sent to the
   *                            recipient
   */
  function sellGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) external virtual returns (uint256 assetTokenReturned);

  /**
   * @dev Liquidate everything to the asset token in one function call
   *
   * @return assetTokenReturned The amount of asset token returned
   */
  function exit() external virtual returns (uint256 assetTokenReturned);
}

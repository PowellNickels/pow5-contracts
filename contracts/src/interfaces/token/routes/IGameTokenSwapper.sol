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
 * @dev Token router to swap between the game token and its asset token
 */
interface IGameTokenSwapper {
  //////////////////////////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Emitted when POW1 is purchased with the market token
   *
   * @param sender The sender of the market token
   * @param recipient The address of the recipient of the POW1
   * @param marketTokenAmount The amount of the market token being spent
   * @param pow1Returned The amount of POW1 received
   */
  event POW1Bought(
    address indexed sender,
    address indexed recipient,
    uint256 marketTokenAmount,
    uint256 pow1Returned
  );

  /**
   * @dev Emitted when POW5 is purchased with the stable token
   *
   * @param sender The sender of the market token
   * @param recipient The address of the recipient of the POW5
   * @param stableTokenAmount The amount of the stable token being spent
   * @param pow5Returned The amount of POW5 received
   */
  event POW5Bought(
    address indexed sender,
    address indexed recipient,
    uint256 stableTokenAmount,
    uint256 pow5Returned
  );

  /**
   * @dev Emitted when POW1 is sold for the market token
   *
   * @param sender The sender of the game token
   * @param recipient The address of the recipient of the market token
   * @param pow1Amount The amount of POW1 being spent
   * @param marketTokenReturned The amount of the market token received
   */
  event POW1Sold(
    address indexed sender,
    address indexed recipient,
    uint256 pow1Amount,
    uint256 marketTokenReturned
  );

  /**
   * @dev Emitted when POW5 is sold for the stable token
   *
   * @param sender The sender of the game token
   * @param recipient The address of the recipient of the stable token
   * @param pow5Amount The amount of POW5 being spent
   * @param stableTokenReturned The amount of the stable token received
   */
  event POW5Sold(
    address indexed sender,
    address indexed recipient,
    uint256 pow5Amount,
    uint256 stableTokenReturned
  );

  //////////////////////////////////////////////////////////////////////////////
  // External accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Returns true if the game token is token0 in the pool
   *
   * @return True if the game token is token0, false otherwise
   */
  function gameIsToken0() external view returns (bool);

  //////////////////////////////////////////////////////////////////////////////
  // External interface for swapping into the game token
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Swaps the asset token for the game token
   *
   * @param assetTokenAmount The ammount of the asset token to include in the
   *        swap
   * @param recipient The receiver of the game token
   *
   * @return gameTokenReturned The amount of the game token returned to the
   * recipient
   */
  function buyGameToken(
    uint256 assetTokenAmount,
    address recipient
  ) external returns (uint256 gameTokenReturned);

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
  ) external returns (uint256 assetTokenReturned);

  /**
   * @dev Liquidate everything to the asset token in one function call
   *
   * @return assetTokenReturned The amount of asset token returned
   */
  function exit() external returns (uint256 assetTokenReturned);
}

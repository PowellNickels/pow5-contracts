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

import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IDexTokenSwapper} from "../../interfaces/token/routes/IDexTokenSwapper.sol";

import {UniV3Swapper} from "./UniV3Swapper.sol";

/**
 * @dev Token router to swap between the market token and the stable token
 */
contract DexTokenSwapper is
  Context,
  ReentrancyGuard,
  UniV3Swapper,
  IDexTokenSwapper
{
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param marketToken_ The address of the POW1 token
   * @param stableToken_ The address of the stable token
   * @param marketStablePool_ The address of the pool contract for the token
   *        pair
   */
  constructor(
    address marketToken_,
    address stableToken_,
    address marketStablePool_
  ) UniV3Swapper(marketToken_, stableToken_, marketStablePool_) {}

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDexTokenSwapper}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDexTokenSwapper-buyMarketToken}
   */
  function buyMarketToken(
    uint256 stableTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 marketTokenReturned) {
    // Call ancestor
    marketTokenReturned = _buyNumeratorToken(stableTokenAmount, recipient);

    // Emit event
    emit MarketTokenBought(
      _msgSender(),
      recipient,
      stableTokenAmount,
      marketTokenReturned
    );

    return marketTokenReturned;
  }

  /**
   * @dev See {IDexTokenSwapper-sellMarketToken}
   */
  function sellMarketToken(
    uint256 marketTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 stableTokenReturned) {
    // Call ancestor
    stableTokenReturned = _sellNumeratorToken(marketTokenAmount, recipient);

    // Emit event
    emit MarketTokenSold(
      _msgSender(),
      recipient,
      marketTokenAmount,
      stableTokenReturned
    );

    return stableTokenReturned;
  }

  /**
   * @dev See {IDexTokenSwapper-exit}
   */
  function exit()
    public
    override
    nonReentrant
    returns (uint256 stableTokenReturned)
  {
    // Read external state
    uint256 marketTokenAmount = _numeratorToken.balanceOf(_msgSender());

    // Call ancestor
    stableTokenReturned = _exitSwapper();

    // Emit event
    emit MarketTokenSold(
      _msgSender(),
      _msgSender(),
      marketTokenAmount,
      stableTokenReturned
    );

    return stableTokenReturned;
  }
}

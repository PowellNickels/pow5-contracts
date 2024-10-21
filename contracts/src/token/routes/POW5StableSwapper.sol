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

import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IGameTokenSwapper} from "../../interfaces/token/routes/IGameTokenSwapper.sol";

import {UniV3Swapper} from "./UniV3Swapper.sol";

/**
 * @dev Token router to swap between the game token and a yielding asset token
 */
contract POW5StableSwapper is
  Context,
  ReentrancyGuard,
  UniV3Swapper,
  IGameTokenSwapper
{
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param pow5Token_ The address of the POW5 token
   * @param marketToken_ The address of the market token
   * @param pow5MarketPool_ The address of the pool contract for the token pair
   */
  constructor(
    address pow5Token_,
    address marketToken_,
    address pow5MarketPool_
  ) UniV3Swapper(pow5Token_, marketToken_, pow5MarketPool_) {}

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IGameTokenSwapper}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IGameTokenSwapper-gameIsToken0}
   */
  function gameIsToken0() public view override returns (bool) {
    return _numeratorIsToken0;
  }

  /**
   * @dev See {IGameTokenSwapper-buyGameToken}
   */
  function buyGameToken(
    uint256 assetTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 gameTokenReturned) {
    // Call ancestor
    gameTokenReturned = _buyNumeratorToken(assetTokenAmount, recipient);

    // Emit event
    emit GameTokenBought(
      _msgSender(),
      recipient,
      address(_numeratorToken),
      address(_denominatorToken),
      assetTokenAmount,
      gameTokenReturned
    );

    return gameTokenReturned;
  }

  /**
   * @dev See {IGameTokenSwapper-sellGameToken}
   */
  function sellGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 assetTokenReturned) {
    // Call ancestor
    assetTokenReturned = _sellNumeratorToken(gameTokenAmount, recipient);

    // Emit event
    emit GameTokenSold(
      _msgSender(),
      recipient,
      address(_numeratorToken),
      address(_denominatorToken),
      gameTokenAmount,
      assetTokenReturned
    );

    return assetTokenReturned;
  }

  /**
   * @dev See {IGameTokenSwapper-exit}
   */
  function exit()
    public
    override
    nonReentrant
    returns (uint256 assetTokenReturned)
  {
    // Call ancestor
    uint256 gameTokenAmount;
    (gameTokenAmount, assetTokenReturned) = _exitSwapper();

    // Emit event
    emit GameTokenSold(
      _msgSender(),
      _msgSender(),
      address(_numeratorToken),
      address(_denominatorToken),
      gameTokenAmount,
      assetTokenReturned
    );
  }
}

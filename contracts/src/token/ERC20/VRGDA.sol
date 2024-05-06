/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * This file is derived from the VRGDAs project under the MIT license.
 * https://github.com/transmissions11/VRGDAs
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0 AND MIT
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.25;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {wadLn, wadMul, wadExp, unsafeWadMul, toWadUnsafe} from "solmate/src/utils/SignedWadMath.sol";

import {ERC20Issuable} from "./extensions/ERC20Issuable.sol";

/**
 * @title Variable Rate Gradual Dutch Auction
 */
contract VRGDA is ERC20Issuable {
  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The ERC 20 token name used by wallets to identify the token
   */
  string private constant TOKEN_NAME = "$VRGDA";

  /**
   * @dev The ERC 20 token symbol used as an abbreviation of the token, such
   * as BTC, ETH, AUG or SJCX.
   */
  string private constant TOKEN_SYMBOL = "VRGDA";

  /**
   * @dev The number of decimal places to which the token is divisible
   *
   * 1 token = 1 bips.
   */
  uint8 private constant DECIMALS = 18;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  //
  // TODO: Needs to be per LP-NFT address
  //

  /**
   * @dev Target price for a token, to be scaled according to sales pace
   *
   * Represented as an 18 decimal fixed point number.
   */
  int256 internal immutable _targetPrice;

  /**
   * @dev Precomputed constant that allows us to rewrite pow() as an exp()
   *
   * Represented as an 18 decimal fixed point number.
   */
  int256 internal immutable _decayConstant;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Construct a new VRGDA
   *
   * @param owner_ The owner of the token
   * @param targetPrice Target price for a token if sold on pace, scaled by 1e18
   * @param priceDecayConstant The percent price decays per unit of time with no sales, scaled by 1e18
   */
  constructor(
    address owner_,
    int256 targetPrice,
    int256 priceDecayConstant
  ) ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");

    // Initialize {AccessControl} via {ERC20Issuable}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize state
    _targetPrice = targetPrice;
    _decayConstant = wadLn(1e18 - priceDecayConstant);

    // Validate state
    // The decay constant must be negative for VRGDAs to work
    require(_decayConstant < 0, "Nonnegative decay constant");
  }

  //////////////////////////////////////////////////////////////////////////////
  // Pricing logic
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Calculate the price of a token according to the VRGDA formula.
   *
   * @param timeSinceStart Time passed since the VRGDA began, scaled by 1e18
   * @param sold The total number of tokens that have been sold so far
   *
   * @return The price of a token according to VRGDA, scaled by 1e18
   */
  function getVRGDAPrice(
    int256 timeSinceStart,
    uint256 sold
  ) public view virtual returns (uint256) {
    unchecked {
      return
        uint256(
          wadMul(
            _targetPrice,
            wadExp(
              unsafeWadMul(
                _decayConstant,
                // Theoretically calling toWadUnsafe with sold can silently
                // overflow but under any reasonable circumstance it will never
                // be large enough. We use sold + 1 as the VRGDA formula's n
                // param represents the nth token and sold is the n-1th token.
                timeSinceStart - getTargetSaleTime(toWadUnsafe(sold + 1))
              )
            )
          )
        );
    }
  }

  /**
   * @dev Given a number of tokens sold, return the target time that number of
   * tokens should be sold by
   *
   * @param sold A number of tokens sold, scaled by 1e18, to get the
   *             corresponding target sale time for
   *
   * @return The target time the tokens should be sold by, scaled by 1e18,
   *         where the time is relative, such that 0 means the tokens should be
   *         sold immediately when the VRGDA begins
   */
  function getTargetSaleTime(int256 sold) public view virtual returns (int256) {
    // TODO
    sold;
    return 0;
  }
}

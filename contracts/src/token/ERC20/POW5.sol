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

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import {ERC20Issuable} from "./extensions/ERC20Issuable.sol";

/**
 * @title ERC-20: Token Standard implementation
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-20
 */
contract POW5 is ERC20Issuable {
  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The ERC 20 token name used by wallets to identify the token
   */
  string private constant TOKEN_NAME = "Powell Nickels";

  /**
   * @dev The ERC 20 token symbol used as an abbreviation of the token, such
   * as BTC, ETH, AUG or SJCX.
   */
  string private constant TOKEN_SYMBOL = "POW5";

  /**
   * @dev The number of decimal places to which the token is divisible
   */
  uint8 public constant DECIMALS = 15;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the ERC-20 token with a name and symbol
   *
   * @param owner_ The owner of the token
   */
  constructor(address owner_) ERC20(TOKEN_NAME, TOKEN_SYMBOL) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC20Metadata} via {ERC20Issuable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC20Metadata-decimals}
   */
  function decimals() public pure override returns (uint8) {
    return DECIMALS;
  }
}

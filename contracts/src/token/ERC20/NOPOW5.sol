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
import {ERC20Nontransferable} from "./extensions/ERC20Nontransferable.sol";

/**
 * @title ERC-20: Token Standard implementation
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-20
 */
contract NOPOW5 is ERC20Issuable, ERC20Nontransferable {
  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The ERC 20 token name used by wallets to identify the token
   */
  string private constant TOKEN_NAME = "Powell Nickels Debt";

  /**
   * @dev The ERC 20 token symbol used as an abbreviation of the token, such
   * as BTC, ETH, AUG or SJCX.
   */
  string private constant TOKEN_SYMBOL = "NOPOW5";

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

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ERC20} via {ERC20Issuable} and {ERC20Nontransferable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ERC20-_update}
   */
  function _update(
    address from,
    address to,
    uint256 value
  ) internal virtual override(ERC20, ERC20Nontransferable) {
    // Call ancesor
    super._update(from, to, value);
  }
}

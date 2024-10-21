/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ERC-20: Token Standard, optional nontransferable extension
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-20
 */
abstract contract ERC20Nontransferable is ERC20 {
  //////////////////////////////////////////////////////////////////////////////
  // Errors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Emitted when a transfer is attempted
   *
   * @param from The sender
   * @param to The recipient
   * @param value The amount
   */
  error ERC20TransferAttempted(address from, address to, uint256 value);

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ERC20}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ERC20-_update}
   */
  function _update(
    address from,
    address to,
    uint256 value
  ) internal virtual override {
    // Validate parameters
    if (from != address(0) && to != address(0)) {
      revert ERC20TransferAttempted(from, to, value);
    }

    // Call ancestor
    super._update(from, to, value);
  }
}

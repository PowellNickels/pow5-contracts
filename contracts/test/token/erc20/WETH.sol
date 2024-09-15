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

import "../../../depends/canonical-weth/WETH9.sol";

/**
 * @title W-ETH
 *
 * @dev Used for WETH functionality in test suite
 *
 * FOR TESTING ONLY.
 */
contract WETH is WETH9 {
  /**
   * @dev Constructor
   */
  constructor() {
    // Initialize {WETH9}
    name = "Funny Wrapped Ether";
    symbol = "W-ETH";
  }
}

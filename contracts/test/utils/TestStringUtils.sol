/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import "../../src/utils/StringUtils.sol";

/**
 * @dev Contract to test StringUtils library
 */
contract TestStringUtils {
  /**
   * @dev See {StringUtils-stringToBytes32}
   */
  function testBytes32ToString(
    bytes32 input
  ) external pure returns (string memory) {
    return StringUtils.bytes32ToString(input);
  }
}

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
 * @title ERC-1155 Utility Functions
 */
contract ERC1155Utils {
  //////////////////////////////////////////////////////////////////////////////
  // Public utility functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Get an amount array suitable for NFTs (where the total supply of
   * each token is 1)
   */
  function getAmountArray(
    uint256 tokenCount
  ) public pure returns (uint256[] memory) {
    uint256[] memory array = new uint256[](tokenCount);

    for (uint256 i = 0; i < tokenCount; i++) {
      array[i] = 1;
    }

    return array;
  }
}

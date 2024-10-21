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

import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";

import {IERC1155Enumerable} from "../../../interfaces/token/ERC1155/extensions/IERC1155Enumerable.sol";

/**
 * @title ERC-1155 Utility Functions
 */
contract ERC1155Utils {
  using Arrays for uint256[];

  //////////////////////////////////////////////////////////////////////////////
  // Public utility functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Get an amount array suitable for NFTs (where the total supply of
   * each token is 1)
   *
   * @param tokenCount Number of tokens
   *
   * @return array Array of length `tokenCount` with all values set to 1
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

  /**
   * @dev Check that an amount array is suitable for NFTs (where the total
   * supply of each token is 1)
   *
   * @param tokenIds Array of token IDs
   * @param amounts Array of token amounts
   */
  function checkAmountArray(
    uint256[] memory tokenIds,
    uint256[] memory amounts
  ) public pure {
    // Validate parameters
    if (tokenIds.length != amounts.length) {
      revert IERC1155Errors.ERC1155InvalidArrayLength(
        tokenIds.length,
        amounts.length
      );
    }

    // Loop through tokens
    for (uint256 i = 0; i < amounts.length; i++) {
      // Translate parameters
      uint256 amount = amounts.unsafeMemoryAccess(i);

      // Validate parameters
      if (amount != 1) {
        revert IERC1155Enumerable.ERC1155EnumerableInvalidAmount(
          tokenIds.unsafeMemoryAccess(i),
          amount
        );
      }
    }
  }
}

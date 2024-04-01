/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.25;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Bureau of the Yield Harvest
 *
 * Lend your LP-NFT to The Reserve. Earn interest while accruing DeFi yield.
 */
interface IYieldHarvest is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Lend an LP-SFT to the farm
   *
   * @param tokenId The LP-SFT token ID
   */
  function lendLpSft(uint256 tokenId) external;

  /**
   * @dev Withdraw an LP-SFT from the farm
   *
   * @param tokenId The LP-SFT ID
   */
  function withdrawLpSft(uint256 tokenId) external;
}

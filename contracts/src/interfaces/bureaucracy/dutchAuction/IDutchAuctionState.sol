/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Bureau of the Dutch Auction, State Interface
 *
 * @dev This includes both state and derived state of the current enabled
 * auctions
 */
interface IDutchAuctionState is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Types
  //////////////////////////////////////////////////////////////////////////////

  // TODO
  /**
   * @dev The VRGDA parameters for a logistic-to-linear schedule
   *
  struct VRGDAParams {
    int256 targetPrice; // p0
    int256 priceDecayPercent; // k
    int256 logisticLimit; // L
    int256 timeScale; // s
    int256 soldBySwitch; // n at switch
    int256 switchTime; // t at switch
    int256 perTimeUnit; // r
  }
  */

  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Get the LP-NFT price for a slot
   *
   * @param slot The auction slot
   *
   * @return The LP-NFT price in bips, scaled by 1e18
   */
  function getPrice(uint256 slot) external view returns (uint256);
}

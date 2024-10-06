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

  /**
   * @dev The VRGDA parameters for a logistic-to-linear schedule
   */
  struct VRGDAParams {
    int256 targetPrice; // p0
    int256 priceDecayPercent; // k
    int256 logisticLimit; // L
    int256 timeScale; // s
    int256 soldBySwitch; // n at switch
    int256 switchTime; // t at switch
    int256 perTimeUnit; // r
  }

  /**
   * @dev Represents an active auction in the Dutch Auction
   *
   * Each auction slot holds information about the current state of the auction,
   * including pricing, token amounts, and the timing parameters for price decay.
   */
  struct AuctionSlot {
    /**
     * @dev The current LP-NFT token ID associated with this auction
     */
    uint256 lpNftTokenId;
    /**
     * @dev The time when the auction started
     */
    uint256 auctionStartTime;
    /**
     * @dev The total number of tokens sold in this auction slot
     *
     * This value is used to adjust the price according to the VRGDA formula, where
     * more sales generally lead to higher prices.
     */
    uint256 sold;
    /**
     * @dev The VRGDA parameters for the auction schedule
     */
    VRGDAParams vrgdaParams;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Get the auction information for all active auctions
   *
   * @return auctionSlots An array of AuctionSlot structs containing information
   * for all active auctions
   */
  function getAuctions()
    external
    view
    returns (AuctionSlot[] memory auctionSlots);

  /**
   * @dev Get the auction information for a specific LP-NFT token ID
   *
   * @param lpNftTokenId The LP-NFT token ID to query
   *
   * @return auctionSlot The auction information for the specified LP-NFT token ID
   */
  function getAuction(
    uint256 lpNftTokenId
  ) external view returns (AuctionSlot memory auctionSlot);
}

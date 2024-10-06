/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IDutchAuctionState} from "./IDutchAuctionState.sol";

/**
 * @title Bureau of the Dutch Auction, Admin Action Interface
 */
interface IDutchAuctionAdminActions is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Admin interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialize the Dutch Auction
   *
   * The Dutch Auction is initialized my minting the first POW1 LP-NFT and its
   * holding LP-SFT. No creator tip is paid.
   *
   * It is assumed that this will be the first liquidity deposited in the pool,
   * so both pow1Amount and marketTokenAmount are required to be non-zero.
   *
   * @param pow1Amount The amount of the game token to deposit
   * @param marketTokenAmount The amount of the asset token to deposit
   * @param receiver The receiver of the POW1 LP-SFT
   *
   * @return nftTokenId The initial LP-NFT/LP-SFT token ID
   */
  function initialize(
    uint256 pow1Amount,
    uint256 marketTokenAmount,
    address receiver
  ) external returns (uint256 nftTokenId);

  /**
   * @dev Check if the Dutch Auction is initialized
   *
   * @return True if the Dutch Auction is initialized, false otherwise
   */
  function isInitialized() external view returns (bool);

  /**
   * @dev Set the auction for a slot, allowing for multiple auctions
   *
   * @param slot The auction slot
   * @param targetPrice Target price for a token if sold on pace, scaled by 1e18
   * @param priceDecayConstant The percent price decays per unit of time with
   *                           no sales, scaled by 1e18
   * @param dustLossAmount The maximum loss of either token to dust in the pool
   */
  function setAuction(
    uint256 slot,
    int256 targetPrice,
    int256 priceDecayConstant,
    uint256 dustLossAmount
  ) external;

  /**
   * @dev Remove the auction for a slot
   *
   * @param slot The auction slot
   */
  function removeAuction(uint256 slot) external;
}

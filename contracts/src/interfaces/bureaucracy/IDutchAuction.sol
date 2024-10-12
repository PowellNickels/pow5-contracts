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
 * @title Bureau of the Dutch Auction
 *
 * Buy a pay-what-you-want LP-NFT from The Reserve. At sale time, the LP-NFT is
 * wrapped in an LP-SFT, earning the owner enhanced DeFi yield.
 *
 * A DeFi degen tip is set by a VRGDA (variable rate gradual dutch auction),
 * starting at 1 bip (0.01%) and increasing with each sale. A dutch auction
 * gradually decreases the price over time, creating a more balanced and fair
 * auction process.
 */
interface IDutchAuction is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Admin interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialize the Dutch Auction
   *
   * The Dutch Auction is initialized by minting the first POW1 LP-SFT. No
   * creator tip is paid.
   *
   * It is assumed that this will be the first liquidity deposited in the pool,
   * so both pow1Amount and marketTokenAmount are required to be non-zero.
   *
   * @param pow1Amount The amount of the game token to deposit
   * @param marketTokenAmount The amount of the market token to deposit
   * @param receiver The receiver of the POW1 LP-SFT
   *
   * @return nftTokenId The LP-NFT/LP-SFT token ID
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

  /**
   * @dev Purchase and stake an LP-NFT at the current auction price
   *
   * If either `pow1Amount` or `marketTokenAmount` are zero, the purchase
   * will be done via single-sided supply; about half of one token is swapped
   * for the other before pooling. If neither are zero, the tokens will be
   * supplied to the pool with no swap, and any unconsumed tokens (due to an
   * imbalance with the current pool price) will be returned to the sender.
   *
   * @param slot The auction slot
   * @param pow1Amount The amount of the game token to deposit
   * @param marketTokenAmount The amount of the market token to deposit
   * @param receiver The receiver of the LP-SFT
   *
   * @return nftTokenId The LP-NFT/LP-SFT token ID
   */
  function purchase(
    uint256 slot,
    uint256 pow1Amount,
    uint256 marketTokenAmount,
    address receiver
  ) external returns (uint256 nftTokenId);

  /**
   * @dev Exit a POW1 LP-SFT position
   *
   * This function allows the LP-SFT owner to exit the pool, receiving their
   * share of the pool's assets in the form of the market token. The LP-SFT is
   * burned in the process. The empty LP-NFT is returned to the sender.
   *
   * @param tokenId The LP-NFT/LP-SFT token ID
   */
  function exit(uint256 tokenId) external;
}

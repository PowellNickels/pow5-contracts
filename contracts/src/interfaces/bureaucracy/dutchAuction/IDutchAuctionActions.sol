/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/**
 * @title Bureau of the Dutch Auction, Public Action Interface
 */
interface IDutchAuctionActions is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Purchase and stake an LP-NFT at the current auction price
   *
   * If either `pow1Amount` or `marketTokenAmount` are zero, the purchase will
   * be done via single-sided supply; about half of one token is swapped for the
   * other before pooling. If neither are zero, the tokens will be supplied to
   * the pool with no swap, and any unconsumed tokens (due to an imbalance with
   * the current pool price) will be returned to the sender.
   *
   * Upon purchase, the LP-NFT is staked in a stake farm, and an LP-SFT is
   * minted to the receiver.
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
   * This function allows an LP-SFT holder to exit the pool, receiving their
   * share of the pool's assets in the form of the asset token. The LP-SFT is
   * burned in the process. The empty LP-NFT is returned to the sender as a
   * keepsake.
   *
   * @param lpNftTokenId The LP-NFT token ID
   */
  function exit(uint256 lpNftTokenId) external;
}

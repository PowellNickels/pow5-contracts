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
   * so both gameTokenAmount and assetTokenAmount are required to be non-zero.
   *
   * @param gameTokenAmount The amount of the game token to deposit
   * @param assetTokenAmount The amount of the asset token to deposit
   * @param receiver The receiver of the POW1 LP-SFT
   *
   * @return nftTokenId The initial LP-NFT/LP-SFT token ID
   */
  function initialize(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address receiver
  ) external returns (uint256 nftTokenId);

  /**
   * @dev Check if the Dutch Auction is initialized
   *
   * @return True if the Dutch Auction is initialized, false otherwise
   */
  function isInitialized() external view returns (bool);

  /**
   * @dev Create a new auction
   *
   * @param vrgdaParams The parameters for the VRGDA auction
   * @param dustLossAmount The amount of dust loss to allow
   */
  function createAuction(
    IDutchAuctionState.VRGDAParams calldata vrgdaParams,
    uint256 dustLossAmount
  ) external;
}

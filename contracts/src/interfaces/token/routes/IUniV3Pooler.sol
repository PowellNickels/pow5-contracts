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
 * @dev Token router send to liquidity to the Uniswap V3 pool in exchange for
 * an LP NFT
 */
abstract contract IUniV3Pooler {
  //////////////////////////////////////////////////////////////////////////////
  // Events
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Emitted when a Uniswap V3 LP NFT is minted
   *
   * @param sender The sender of the assets being paid
   * @param recipient The address of the recipient of the LP NFT
   * @param nftAddress The address of the NFT manager contract
   * @param nftTokenId The ID of the NFT
   * @param gameTokenShare The amount of the game token in the NFT
   * @param assetTokenShare The amount of the asset token in the NFT
   * @param liquidityAmount The amount of liquidity created
   */
  event NFTMinted(
    address indexed sender,
    address indexed recipient,
    address nftAddress,
    uint256 nftTokenId,
    uint256 gameTokenShare,
    uint256 assetTokenShare,
    uint256 liquidityAmount
  );

  /**
   * @dev Emitted when fees are collected from a Uniswap V3 LP NFT
   *
   * @param sender The sender of the collection request
   * @param recipient The address of the recipient of the LP NFT fees
   * @param nftAddress The address of the NFT manager contract
   * @param nftTokenId The ID of the NFT
   * @param liquidityAmount The amount of liquidity in the NFT before collection
   * @param gameTokenCollected The amount of game token fees collected
   * @param assetTokenCollected The amount of asset token fees collected
   * @param assetTokenReturned The amount of the asset token returned to the recipient
   */
  event NFTCollected(
    address indexed sender,
    address indexed recipient,
    address nftAddress,
    uint256 nftTokenId,
    uint256 liquidityAmount,
    uint256 gameTokenCollected,
    uint256 assetTokenCollected,
    uint256 assetTokenReturned
  );

  //////////////////////////////////////////////////////////////////////////////
  // External interface for adding liquidity
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mints an LP NFT and deposits liquidity into the pool using the game
   *      token
   *
   * A swap will occur to allow for single-sided supply.
   *
   * @param gameTokenAmount The amounts of the game token to deposit
   * @param recipient The recipient of the LP NFT
   *
   * @return nftTokenId The ID of the minted NFT
   */
  function mintNFTWithGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) external virtual returns (uint256 nftTokenId);

  /**
   * @dev Mints an LP NFT and deposits liquidity into the pool using the asset
   * token
   *
   * A swap will occur to allow for single-sided supply.
   *
   * @param assetTokenAmount The amount of the the asset token to use
   * @param recipient The recipient of the LP NFT
   *
   * @return nftTokenId The ID of the minted NFT
   */
  function mintNFTWithAssetToken(
    uint256 assetTokenAmount,
    address recipient
  ) external virtual returns (uint256 nftTokenId);

  /**
   * @dev Mints a Uniswap V3 LP NFT and deposits liquidity into the pool
   * without performing a token swap
   *
   * @param gameTokenAmount The amount of the game token to deposit
   * @param assetTokenAmount The amounts of the asset token to deposit
   * @param recipient The recient of the LP NFT
   *
   * @return nftTokenId The ID of the minted NFT
   */
  function mintNFTImbalance(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address recipient
  ) external virtual returns (uint256 nftTokenId);

  //////////////////////////////////////////////////////////////////////////////
  // External interface for removing liquidity
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Collects the tokens and fees from an LP NFT and returns the asset
   * token and empty LP NFT to the recipient
   *
   * @param nftTokenId The ID of the LP NFT
   * @param recipient The recipient of the fees and the LP NFT
   *
   * @return assetTokenReturned The amount of the asset token returned to the
   * recipient
   */
  function collectFromNFT(
    uint256 nftTokenId,
    address recipient
  ) external virtual returns (uint256 assetTokenReturned);

  /**
   * @dev Liquidates everything to the asset token in one transaction and
   * returns the empty LP NFT
   *
   * @param nftTokenId The ID of the LP NFT
   *
   * @return assetTokenReturned The amount of the asset token returned to the
   *                            sender
   */
  function exit(
    uint256 nftTokenId
  ) external virtual returns (uint256 assetTokenReturned);
}

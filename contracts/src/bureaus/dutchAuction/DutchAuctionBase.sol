/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuctionErrors} from "../../interfaces/bureaus/dutchAuction/IDutchAuctionErrors.sol";
import {IDutchAuctionEvents} from "../../interfaces/bureaus/dutchAuction/IDutchAuctionEvents.sol";

import {DutchAuctionRoutes} from "./DutchAuctionRoutes.sol";
import {DutchAuctionState} from "./DutchAuctionState.sol";

/**
 * @title Bureau of the Dutch Auction, Base Functionality
 */
abstract contract DutchAuctionBase is
  IDutchAuctionEvents,
  IDutchAuctionErrors,
  DutchAuctionRoutes,
  DutchAuctionState
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IDutchAuctionRoutes} and
  // {IDutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    virtual
    override(DutchAuctionRoutes, DutchAuctionState)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Internal utility functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mint an LP-NFT
   *
   * Tokens provided are returned, minus a small amount lost to dust.
   *
   * @param gameTokenAmount The amount of game tokens used to mint the LP-NFT
   * @param assetTokenAmount The amount of asset tokens used to mint the LP-NFT
   *
   * @return lpNftTokenId The token ID of the LP-NFT minted
   */
  function _mintLpNft(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount
  ) internal returns (uint256 lpNftTokenId) {
    // Uniswap V3 cannot mint a token with zero liquidity
    require(gameTokenAmount > 0, "No game token");
    require(assetTokenAmount > 0, "No asset token");

    // Approve pooler to spend tokens
    _gameToken.safeIncreaseAllowance(address(_uniV3Pooler), gameTokenAmount);
    _assetToken.safeIncreaseAllowance(address(_uniV3Pooler), assetTokenAmount);

    // Mint an LP-NFT
    lpNftTokenId = _uniV3Pooler.mintNFTImbalance(
      gameTokenAmount,
      assetTokenAmount,
      address(this)
    );

    // Validate external state
    require(
      _uniswapV3NftManager.ownerOf(lpNftTokenId) == address(this),
      "Not owner"
    );

    // Read external state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 uniV3LiquidityAmount, , , , ) = _uniswapV3NftManager
      .positions(lpNftTokenId);

    // Withdraw tokens from the pool
    // slither-disable-next-line unused-return
    _uniswapV3NftManager.decreaseLiquidity(
      INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: lpNftTokenId,
        liquidity: uniV3LiquidityAmount,
        amount0Min: 0,
        amount1Min: 0,
        deadline: block.timestamp
      })
    );

    // Collect the tokens and fees
    // slither-disable-next-line unused-return
    _uniswapV3NftManager.collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: lpNftTokenId,
        recipient: address(this),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    return lpNftTokenId;
  }
}

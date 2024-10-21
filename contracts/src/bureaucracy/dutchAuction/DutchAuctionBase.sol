/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuction} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuction.sol";

import {DutchAuctionRoutes} from "./DutchAuctionRoutes.sol";
import {DutchAuctionState} from "./DutchAuctionState.sol";

/**
 * @title Bureau of the Dutch Auction, Base Functionality
 */
abstract contract DutchAuctionBase is
  IDutchAuction,
  AccessControl,
  ReentrancyGuard,
  DutchAuctionRoutes,
  DutchAuctionState
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IDutchAuction}, {AccessControl},
  // {DutchAuctionRoutes} and {IDutchAuctionState}
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
    override(IERC165, AccessControl, DutchAuctionRoutes, DutchAuctionState)
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IDutchAuction).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Internal utility functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mint an LP-NFT
   *
   * Tokens provided are returned, minus a small amount lost to dust.
   *
   * @param pow1Amount The amount of POW1 used to mint the LP-NFT
   * @param marketTokenAmount The amount of the market token used to mint the LP-NFT
   *
   * @return lpNftTokenId The token ID of the LP-NFT minted
   */
  function _mintLpNft(
    uint256 pow1Amount,
    uint256 marketTokenAmount
  ) internal returns (uint256 lpNftTokenId) {
    // Uniswap V3 cannot mint a token with zero liquidity
    require(pow1Amount > 0, "No POW1");
    require(marketTokenAmount > 0, "No market token");

    // Approve pooler to spend tokens
    _routes.pow1Token.safeIncreaseAllowance(
      address(_routes.pow1MarketPooler),
      pow1Amount
    );
    _routes.marketToken.safeIncreaseAllowance(
      address(_routes.pow1MarketPooler),
      marketTokenAmount
    );

    // Mint an LP-NFT
    lpNftTokenId = _routes.pow1MarketPooler.mintLpNftImbalance(
      pow1Amount,
      marketTokenAmount,
      address(this)
    );

    // Validate external state
    require(
      _routes.uniswapV3NftManager.ownerOf(lpNftTokenId) == address(this),
      "Not owner"
    );

    // Read external state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 liquidityAmount, , , , ) = _routes
      .uniswapV3NftManager
      .positions(lpNftTokenId);

    // Withdraw tokens from the pool
    // slither-disable-next-line unused-return
    _routes.uniswapV3NftManager.decreaseLiquidity(
      INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: lpNftTokenId,
        liquidity: liquidityAmount,
        amount0Min: 0,
        amount1Min: 0,
        deadline: block.timestamp
      })
    );

    // Collect the tokens and fees
    // slither-disable-next-line unused-return
    _routes.uniswapV3NftManager.collect(
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

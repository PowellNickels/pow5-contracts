/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuctionActions} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionActions.sol";
import {VRGDA} from "../../utils/auction/VRGDA.sol";
import {LiquidityMath} from "../../utils/math/LiquidityMath.sol";

import {DutchAuctionBase} from "./DutchAuctionBase.sol";

/**
 * @title Bureau of the Dutch Auction
 */
abstract contract DutchAuctionActions is
  IDutchAuctionActions,
  DutchAuctionBase
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IDutchAuctionActions},
  // {DutchAuctionRoutes} and {DutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, DutchAuctionBase) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IDutchAuctionActions).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionActions}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuctionActions-purchase}
   */
  function purchase(
    uint256 slot,
    uint256 pow1Amount,
    uint256 marketTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 nftTokenId) {
    // Validate parameters
    require(pow1Amount > 0 || marketTokenAmount > 0, "Invalid amounts");
    require(receiver != address(0), "Invalid receiver");

    // Read state
    VRGDA auction = _slotToAuction[slot];
    nftTokenId = _slotToLpNft[slot];

    int256 timeSinceStart = 1; // TODO
    uint256 sold = 0; // TODO
    // slither-disable-next-line divide-before-multiply
    uint256 creatorTipBips = auction.getVRGDAPrice(timeSinceStart, sold) / 1e18;

    // Calculate the auction tip
    uint256 pow1TipAmount = (pow1Amount * creatorTipBips) / 1e4;
    uint256 marketTipAmount = (marketTokenAmount * creatorTipBips) / 1e4;

    // Calculate the deposited liquidity
    uint256 pow1LiquidityAmount = pow1Amount - pow1TipAmount;
    uint256 marketLiquidityAmount = marketTokenAmount - marketTipAmount;

    // Get the pool fee
    uint24 poolFee = _routes.pow1MarketPool.fee();

    // Validate state
    require(pow1TipAmount > 0 || marketTipAmount > 0, "Invalid tips");
    require(
      pow1LiquidityAmount > 0 || marketLiquidityAmount > 0,
      "Invalid liquidity"
    );

    // Call external contracts
    if (pow1Amount > 0) {
      _routes.pow1Token.safeTransferFrom(
        _msgSender(),
        address(this),
        pow1Amount
      );
    }
    if (marketTokenAmount > 0) {
      _routes.marketToken.safeTransferFrom(
        _msgSender(),
        address(this),
        marketTokenAmount
      );
    }

    // Perform single-sided supply swap
    if (pow1LiquidityAmount == 0) {
      // Get market token reserve
      uint256 marketTokenReserve = _routes.marketToken.balanceOf(
        address(_routes.pow1MarketPool)
      );

      // Calculate market swap amount
      uint256 marketSwapAmount = LiquidityMath.computeSwapAmountV2(
        marketTokenReserve,
        marketLiquidityAmount,
        poolFee
      );
      require(marketSwapAmount <= marketLiquidityAmount, "Bad liquidity math");

      // Approve swap
      _routes.marketToken.safeIncreaseAllowance(
        address(_routes.pow1MarketSwapper),
        marketSwapAmount
      );

      // Perform swap
      pow1LiquidityAmount = _routes.pow1MarketSwapper.buyGameToken(
        marketSwapAmount,
        address(this)
      );

      // Update amount
      marketLiquidityAmount -= marketSwapAmount;
    } else if (marketLiquidityAmount == 0) {
      // Get POW1 reserve
      uint256 pow1Reserve = _routes.pow1Token.balanceOf(
        address(_routes.pow1MarketPool)
      );

      // Calculate POW1 swap amount
      uint256 pow1SwapAmount = LiquidityMath.computeSwapAmountV2(
        pow1Reserve,
        pow1LiquidityAmount,
        poolFee
      );
      require(pow1SwapAmount <= pow1LiquidityAmount, "Bad liquidity math");

      // Approve swap
      _routes.pow1Token.safeIncreaseAllowance(
        address(_routes.pow1MarketSwapper),
        pow1SwapAmount
      );

      // Perform swap
      marketLiquidityAmount = _routes.pow1MarketSwapper.sellGameToken(
        pow1SwapAmount,
        address(this)
      );

      // Update amount
      pow1LiquidityAmount -= pow1SwapAmount;
    }

    // Validate state
    require(
      pow1LiquidityAmount > 0 || marketLiquidityAmount > 0,
      "Invalid liquidity"
    );

    // Call external contracts
    if (pow1LiquidityAmount > 0) {
      _routes.pow1Token.safeIncreaseAllowance(
        address(_routes.uniswapV3NftManager),
        pow1LiquidityAmount
      );
    }
    if (marketLiquidityAmount > 0) {
      _routes.marketToken.safeIncreaseAllowance(
        address(_routes.uniswapV3NftManager),
        marketLiquidityAmount
      );
    }

    // Deposit liquidity
    // slither-disable-next-line unused-return
    _routes.uniswapV3NftManager.increaseLiquidity(
      INonfungiblePositionManager.IncreaseLiquidityParams({
        tokenId: nftTokenId,
        amount0Desired: address(_routes.pow1Token) <
          address(_routes.marketToken)
          ? pow1LiquidityAmount
          : marketLiquidityAmount,
        amount1Desired: address(_routes.pow1Token) <
          address(_routes.marketToken)
          ? marketLiquidityAmount
          : pow1LiquidityAmount,
        amount0Min: 0,
        amount1Min: 0,
        // slither-disable-next-line timestamp
        deadline: block.timestamp
      })
    );

    // Stake LP-NFT in the stake farm
    _routes.uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(_routes.pow1LpNftStakeFarm),
      nftTokenId,
      ""
    );

    // Return the LP-SFT to the receiver
    _routes.lpSft.safeTransferFrom(address(this), receiver, nftTokenId, 1, "");

    // Emit event
    // TODO

    return nftTokenId;
  }

  /**
   * @dev See {IDutchAuctionActions-exit}
   */
  function exit(uint256 lpNftTokenId) external override nonReentrant {
    // Validate parameters
    require(lpNftTokenId != 0, "Invalid token ID");

    // Validate state
    require(
      _routes.lpSft.ownerOf(lpNftTokenId) == _msgSender(),
      "Not LP-SFT owner"
    );

    // Record POW1 balance to track any recovered from the LP-SFT
    uint256 pow1Balance = _routes.pow1Token.balanceOf(address(this));
    uint256 marketTokenBalance = _routes.marketToken.balanceOf(address(this));

    // Transfer the LP-SFT to the contract
    _routes.lpSft.safeTransferFrom(
      _msgSender(),
      address(this),
      lpNftTokenId,
      1,
      ""
    );

    // Transfer the LP-SFT to the LP-NFT stake farm
    _routes.lpSft.safeTransferFrom(
      address(this),
      address(_routes.pow1LpNftStakeFarm),
      lpNftTokenId,
      1,
      ""
    );

    // Read state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 uniV3LiquidityAmount, , , , ) = _routes
      .uniswapV3NftManager
      .positions(lpNftTokenId);

    // Withdraw tokens from the pool
    // slither-disable-next-line unused-return
    _routes.uniswapV3NftManager.decreaseLiquidity(
      INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: lpNftTokenId,
        liquidity: uniV3LiquidityAmount,
        amount0Min: 0,
        amount1Min: 0,
        // slither-disable-next-line timestamp
        deadline: block.timestamp
      })
    );

    // Collect the tokens and fees
    // slither-disable-next-line unused-return
    _routes.uniswapV3NftManager.collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: lpNftTokenId,
        recipient: _msgSender(),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    // Return the LP-NFT to the sender
    _routes.uniswapV3NftManager.safeTransferFrom(
      address(this),
      _msgSender(),
      lpNftTokenId,
      ""
    );

    // Return tokens recovered from burning the LP-SFT
    uint256 newPow1Balance = _routes.pow1Token.balanceOf(address(this));
    uint256 newMarketTokenBalance = _routes.marketToken.balanceOf(
      address(this)
    );

    if (newPow1Balance > pow1Balance) {
      _routes.pow1Token.safeTransfer(
        address(this),
        newPow1Balance - pow1Balance
      );
    }
    if (newMarketTokenBalance > marketTokenBalance) {
      _routes.marketToken.safeTransfer(
        address(this),
        newMarketTokenBalance - marketTokenBalance
      );
    }

    // Emit event
    // TODO
  }
}

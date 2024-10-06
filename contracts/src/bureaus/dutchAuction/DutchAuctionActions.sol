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
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {unsafeWadDiv, wadDiv, wadExp, wadLn, wadMul} from "solmate/src/utils/SignedWadMath.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuctionActions} from "../../interfaces/bureaus/dutchAuction/IDutchAuctionActions.sol";
import {LiquidityMath} from "../../utils/math/LiquidityMath.sol";
import {VRGDAMath} from "../../utils/math/VRGDAMath.sol";

import {DutchAuctionBase} from "./DutchAuctionBase.sol";

/**
 * @title Bureau of the Dutch Auction
 */
abstract contract DutchAuctionActions is
  Context,
  ReentrancyGuard,
  LiquidityMath,
  DutchAuctionBase,
  IDutchAuctionActions
{
  using EnumerableSet for EnumerableSet.UintSet;
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {DutchAuctionBase} and
  // {DutchAuctionActions}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(DutchAuctionBase, IERC165) returns (bool) {
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
    uint256 lpNftTokenId,
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address receiver,
    address beneficiary
  ) external override nonReentrant {
    // Validate parameters
    require(gameTokenAmount > 0 || assetTokenAmount > 0, "Invalid amounts");
    require(receiver != address(0), "Invalid receiver");

    // Validate state
    require(_activeAuctions.contains(lpNftTokenId), "Auction not active");

    // Read state
    AuctionSlot storage auctionSlot = _auctions[lpNftTokenId];
    VRGDAParams storage vrgdaParams = auctionSlot.vrgdaParams;

    // Validate state
    require(auctionSlot.sold == 0, "Auction already sold");

    // Compute beneficiaryTipBips
    uint256 beneficiaryTipBips = _computeBeneficiaryTipBips(
      auctionSlot,
      vrgdaParams
    );

    // Validate that beneficiaryTipBips > 0
    require(beneficiaryTipBips > 0, "Invalid tip");

    // Process tips and liquidity amounts
    (
      uint256 gameLiquidityAmount,
      uint256 assetLiquidityAmount
    ) = _processTipsAndLiquidity(
        gameTokenAmount,
        assetTokenAmount,
        beneficiaryTipBips,
        beneficiary
      );

    // Perform single-sided supply swap if necessary
    // slither-disable-next-line reentrancy-eth
    (gameLiquidityAmount, assetLiquidityAmount) = _performSingleSidedSwap(
      gameLiquidityAmount,
      assetLiquidityAmount,
      _uniswapV3Pool.fee()
    );

    // Increase liquidity
    uint256 lpTokenAmount = uint256(
      _increaseLiquidity(
        lpNftTokenId,
        gameLiquidityAmount,
        assetLiquidityAmount
      )
    );

    // Update auction state
    auctionSlot.sold += 1;

    // Remove the auction from active auctions
    require(_activeAuctions.remove(lpNftTokenId), "Already removed");

    // Stake LP-NFT in the stake farm
    _uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(_lpNftStakeFarm),
      lpNftTokenId,
      ""
    );

    // Transfer LP-SFT to the receiver
    _lpSft.safeTransferFrom(address(this), receiver, lpNftTokenId, 1, "");

    // Emit event
    emit AuctionPurchased(
      lpNftTokenId,
      lpTokenAmount,
      beneficiaryTipBips,
      _msgSender(),
      receiver
    );
  }

  /**
   * @dev See {IDutchAuctionActions-exit}
   */
  function exit(uint256 lpNftTokenId) external override nonReentrant {
    // Validate parameters
    require(lpNftTokenId != 0, "Invalid token ID");

    // Validate state
    require(_lpSft.ownerOf(lpNftTokenId) == _msgSender(), "Not LP-SFT owner");

    // Record game token balance to track any recovered from the LP-SFT
    uint256 gameTokenBalance = _gameToken.balanceOf(address(this));
    uint256 assetTokenBalance = _assetToken.balanceOf(address(this));

    // Transfer the LP-SFT to the contract
    _lpSft.safeTransferFrom(_msgSender(), address(this), lpNftTokenId, 1, "");

    // Transfer the LP-SFT to the LP-NFT stake farm
    _lpSft.safeTransferFrom(
      address(this),
      address(_lpNftStakeFarm),
      lpNftTokenId,
      1,
      ""
    );

    // Read state
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
        // slither-disable-next-line timestamp
        deadline: block.timestamp
      })
    );

    // Collect the tokens and fees
    // slither-disable-next-line unused-return
    _uniswapV3NftManager.collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: lpNftTokenId,
        recipient: _msgSender(),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    // Return the LP-NFT to the sender
    _uniswapV3NftManager.safeTransferFrom(
      address(this),
      _msgSender(),
      lpNftTokenId,
      ""
    );

    // Return tokens recovered from burning the LP-SFT
    uint256 newGameTokenBalance = _gameToken.balanceOf(address(this));
    uint256 newAssetTokenBalance = _assetToken.balanceOf(address(this));

    if (newGameTokenBalance > gameTokenBalance) {
      _gameToken.safeTransfer(
        address(this),
        newGameTokenBalance - gameTokenBalance
      );
    }
    if (newAssetTokenBalance > assetTokenBalance) {
      _assetToken.safeTransfer(
        address(this),
        newAssetTokenBalance - assetTokenBalance
      );
    }

    // Emit event
    emit AuctionExited(lpNftTokenId, _msgSender());
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private utility functions
  //////////////////////////////////////////////////////////////////////////////

  function _computeBeneficiaryTipBips(
    AuctionSlot storage auctionSlot,
    VRGDAParams storage vrgdaParams
  ) private view returns (uint256 beneficiaryTipBips) {
    // Compute priceDecayConstant
    int256 priceDecayConstant = wadLn(1e18 - vrgdaParams.priceDecayPercent);

    // Compute sold count (scaled by 1e18)
    int256 sold = int256(auctionSlot.sold) * 1e18;

    // Compute targetSaleTime
    int256 targetSaleTime;
    if (sold < vrgdaParams.soldBySwitch) {
      // Logistic schedule
      int256 numerator = vrgdaParams.logisticLimit * 2e18;
      int256 denominator = sold + vrgdaParams.logisticLimit;
      int256 fraction = unsafeWadDiv(numerator, denominator);
      int256 lnValue = wadLn(fraction - 1e18);
      targetSaleTime = -wadDiv(lnValue, vrgdaParams.timeScale);
    } else {
      // Linear schedule
      targetSaleTime =
        wadDiv(sold - vrgdaParams.soldBySwitch, vrgdaParams.perTimeUnit) +
        vrgdaParams.switchTime;
    }

    // Compute timeSinceStartWad
    int256 timeSinceStartWad = int256(
      (block.timestamp - auctionSlot.auctionStartTime) * 1e18
    );

    // Compute timeDelta
    int256 timeDelta = timeSinceStartWad - targetSaleTime;

    // Compute decay
    int256 decay = wadMul(priceDecayConstant, timeDelta);

    // Compute price (beneficiary tip percentage in bips scaled by 1e18)
    int256 priceInt = wadMul(vrgdaParams.targetPrice, wadExp(decay));

    require(priceInt >= 0, "Negative price");

    beneficiaryTipBips = uint256(priceInt); // Tip percentage in bips scaled by 1e18
  }

  function _processTipsAndLiquidity(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    uint256 beneficiaryTipBips,
    address beneficiary
  )
    private
    returns (uint256 gameLiquidityAmount, uint256 assetLiquidityAmount)
  {
    // Calculate the tip amounts for each token
    (uint256 gameTipAmount, uint256 assetTipAmount) = _computeTipAmounts(
      gameTokenAmount,
      assetTokenAmount,
      beneficiaryTipBips
    );

    // Calculate the liquidity amounts after deducting tips
    gameLiquidityAmount = gameTokenAmount - gameTipAmount;
    assetLiquidityAmount = assetTokenAmount - assetTipAmount;

    // Validate liquidity amounts
    require(
      gameLiquidityAmount > 0 || assetLiquidityAmount > 0,
      "Insufficient liquidity after tip"
    );

    // Transfer tokens from buyer to contract
    if (gameTokenAmount > 0) {
      _gameToken.safeTransferFrom(_msgSender(), address(this), gameTokenAmount);
    }
    if (assetTokenAmount > 0) {
      _assetToken.safeTransferFrom(
        _msgSender(),
        address(this),
        assetTokenAmount
      );
    }

    // Transfer the tip amounts to the beneficiary
    if (gameTipAmount > 0) {
      _gameToken.safeTransfer(beneficiary, gameTipAmount);
    }
    if (assetTipAmount > 0) {
      _assetToken.safeTransfer(beneficiary, assetTipAmount);
    }

    // Return the liquidity amounts
    return (gameLiquidityAmount, assetLiquidityAmount);
  }

  function _computeTipAmounts(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    uint256 beneficiaryTipBips
  ) private pure returns (uint256 gameTipAmount, uint256 assetTipAmount) {
    gameTipAmount = (gameTokenAmount * beneficiaryTipBips) / (1e4 * 1e18);
    assetTipAmount = (assetTokenAmount * beneficiaryTipBips) / (1e4 * 1e18);
  }

  function _performSingleSidedSwap(
    uint256 gameLiquidityAmount,
    uint256 assetLiquidityAmount,
    uint24 poolFee
  )
    private
    returns (
      uint256 updatedGameLiquidityAmount,
      uint256 updatedAssetLiquidityAmount
    )
  {
    updatedGameLiquidityAmount = gameLiquidityAmount;
    updatedAssetLiquidityAmount = assetLiquidityAmount;

    if (updatedGameLiquidityAmount == 0) {
      // Swap asset tokens for game tokens
      // Calculate swap amount
      uint256 assetSwapAmount = LiquidityMath.computeSwapAmountV2(
        _assetToken.balanceOf(address(_uniswapV3Pool)),
        updatedAssetLiquidityAmount,
        poolFee
      );
      require(
        assetSwapAmount <= updatedAssetLiquidityAmount,
        "Bad liquidity math"
      );

      // Approve swap
      _assetToken.safeIncreaseAllowance(
        address(_uniV3Swapper),
        assetSwapAmount
      );

      // Perform swap
      updatedGameLiquidityAmount = _uniV3Swapper.buyGameToken(
        assetSwapAmount,
        address(this)
      );

      // Update liquidity amounts
      updatedAssetLiquidityAmount -= assetSwapAmount;
    } else if (updatedAssetLiquidityAmount == 0) {
      // Swap game tokens for asset tokens
      // Calculate swap amount
      uint256 gameSwapAmount = LiquidityMath.computeSwapAmountV2(
        _gameToken.balanceOf(address(_uniswapV3Pool)),
        updatedGameLiquidityAmount,
        poolFee
      );
      require(
        gameSwapAmount <= updatedGameLiquidityAmount,
        "Bad liquidity math"
      );

      // Approve swap
      _gameToken.safeIncreaseAllowance(address(_uniV3Swapper), gameSwapAmount);

      // Perform swap
      updatedAssetLiquidityAmount = _uniV3Swapper.sellGameToken(
        gameSwapAmount,
        address(this)
      );

      // Update liquidity amounts
      updatedGameLiquidityAmount -= gameSwapAmount;
    }

    // Validate liquidity amounts after swap
    require(
      updatedGameLiquidityAmount > 0 && updatedAssetLiquidityAmount > 0,
      "Insufficient liquidity after swap"
    );
  }

  function _increaseLiquidity(
    uint256 lpNftTokenId,
    uint256 gameLiquidityAmount,
    uint256 assetLiquidityAmount
  ) private returns (uint128 liquidityAmount) {
    // Approve tokens to Uniswap V3 NFT Manager
    if (gameLiquidityAmount > 0) {
      _gameToken.safeIncreaseAllowance(
        address(_uniswapV3NftManager),
        gameLiquidityAmount
      );
    }
    if (assetLiquidityAmount > 0) {
      _assetToken.safeIncreaseAllowance(
        address(_uniswapV3NftManager),
        assetLiquidityAmount
      );
    }

    // Deposit liquidity into LP-NFT
    // slither-disable-next-line unused-return
    (liquidityAmount, , ) = _uniswapV3NftManager.increaseLiquidity(
      INonfungiblePositionManager.IncreaseLiquidityParams({
        tokenId: lpNftTokenId,
        amount0Desired: address(_gameToken) < address(_assetToken)
          ? gameLiquidityAmount
          : assetLiquidityAmount,
        amount1Desired: address(_gameToken) < address(_assetToken)
          ? assetLiquidityAmount
          : gameLiquidityAmount,
        amount0Min: 0,
        amount1Min: 0,
        deadline: block.timestamp
      })
    );

    return liquidityAmount;
  }
}

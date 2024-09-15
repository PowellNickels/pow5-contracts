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

pragma solidity 0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IUniswapV3Pool} from "../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IUniV3Pooler} from "../../interfaces/token/routes/IUniV3Pooler.sol";
import {LiquidityMath} from "../../utils/math/LiquidityMath.sol";

import {UniV3Swapper} from "./UniV3Swapper.sol";

/**
 * @dev Token router send to liquidity to the Uniswap V3 pool in exchange for
 *      an LP NFT
 */
contract UniV3Pooler is
  IUniV3Pooler,
  Context,
  ReentrancyGuard,
  ERC721Holder,
  LiquidityMath
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  int24 public constant TICK_LOWER = -887200;

  int24 public constant TICK_UPPER = 887200;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The Powell Nickels Uniswap V3 swapper
   */
  UniV3Swapper public immutable uniV3Swapper;

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  /**
   * @dev The upstream Uniswap V3 pool for the token pair
   */
  IUniswapV3Pool public immutable uniswapV3Pool;

  /**
   * @dev True if the game token is sorted first in the Uniswap V3 pool, false
   * otherwise
   */
  bool public immutable gameIsToken0;

  /**
   * @dev The game token
   */
  IERC20 public immutable gameToken;

  /**
   * @dev The asset token
   */
  IERC20 public immutable assetToken;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param uniV3Swapper_ The address of our Uniswap V3 swapper contract
   * @param uniswapV3NftManager_ The address of the upstream Uniswap V3 NFT
   *                             manager
   */
  constructor(address uniV3Swapper_, address uniswapV3NftManager_) {
    // Validate parameters
    require(uniV3Swapper_ != address(0), "Invalid swapper");
    require(uniswapV3NftManager_ != address(0), "Invalid NFT manager");

    // Validate external contracts
    require(
      address(UniV3Swapper(uniV3Swapper_).uniswapV3Pool()) != address(0),
      "Invalid univ3 swapper pool"
    );
    require(
      address(UniV3Swapper(uniV3Swapper_).gameToken()) != address(0),
      "Invalid univ3 swapper game"
    );
    require(
      address(UniV3Swapper(uniV3Swapper_).assetToken()) != address(0),
      "Invalid univ3 swapper asset"
    );

    // Initialize routes
    uniV3Swapper = UniV3Swapper(uniV3Swapper_);
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
    uniswapV3Pool = UniV3Swapper(uniV3Swapper_).uniswapV3Pool();
    gameIsToken0 = UniV3Swapper(uniV3Swapper_).gameIsToken0();
    gameToken = UniV3Swapper(uniV3Swapper_).gameToken();
    assetToken = IERC20(UniV3Swapper(uniV3Swapper_).assetToken());
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IUniV3Pooler}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IUniV3Pooler-mintNFTWithGameToken}
   */
  function mintNFTWithGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 nftTokenId) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive game token
    _receiveTokens(gameTokenAmount, 0);

    // Get game token reserve
    uint256 gameTokenReserve = gameToken.balanceOf(address(uniswapV3Pool));

    // Get the pool fee
    uint24 poolFee = uniswapV3Pool.fee();

    // Calculate game swap amount
    uint256 gameSwapAmount = LiquidityMath.computeSwapAmountV2(
      gameTokenReserve,
      gameTokenAmount,
      poolFee
    );
    require(gameSwapAmount <= gameTokenAmount, "Bad liquidity math");

    // Swap the game token into the asset token
    uint256 assetTokenAmount = 0;
    if (gameSwapAmount > 0) {
      assetTokenAmount = _sellGameToken(gameSwapAmount);

      // Update game token amount
      gameTokenAmount -= gameSwapAmount;
    }

    // Mint the LP NFT
    nftTokenId = _mintLpNftImbalance(
      gameTokenAmount,
      assetTokenAmount,
      recipient
    );

    // Return any game or asset token dust
    _returnDust(recipient);

    return nftTokenId;
  }

  /**
   * @dev See {IUniV3Pooler-mintNFTWithAssetToken}
   */
  function mintNFTWithAssetToken(
    uint256 assetTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 nftTokenId) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive asset token
    _receiveTokens(0, assetTokenAmount);

    // Get asset token reserve
    uint256 assetTokenReserve = assetToken.balanceOf(address(uniswapV3Pool));

    // Get the pool fee
    uint24 poolFee = uniswapV3Pool.fee();

    // Calculate asset swap amount
    uint256 assetSwapAmount = LiquidityMath.computeSwapAmountV2(
      assetTokenReserve,
      assetTokenAmount,
      poolFee
    );
    require(assetSwapAmount <= assetTokenAmount, "Bad liquidity math");

    // Swap the asset token into the game token
    uint256 gameTokenAmount = 0;
    if (assetSwapAmount > 0) {
      gameTokenAmount = _buyGameToken(assetSwapAmount);

      // Update asset token amount
      assetTokenAmount -= assetSwapAmount;
    }

    // Mint the LP NFT
    nftTokenId = _mintLpNftImbalance(
      gameTokenAmount,
      assetTokenAmount,
      recipient
    );

    // Return any game or asset token dust
    _returnDust(recipient);

    return nftTokenId;
  }

  /**
   * @dev See {IUniV3Pooler-mintNFTImbalance}
   */
  function mintNFTImbalance(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 nftTokenId) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive the tokens
    _receiveTokens(gameTokenAmount, assetTokenAmount);

    // Mint the LP NFT
    nftTokenId = _mintLpNftImbalance(
      gameTokenAmount,
      assetTokenAmount,
      recipient
    );

    // Return any game or asset token dust
    _returnDust(recipient);

    return nftTokenId;
  }

  /**
   * @dev See {IUniV3Pooler-collectFromNFT}
   */
  function collectFromNFT(
    uint256 nftTokenId,
    address recipient
  ) public override nonReentrant returns (uint256 assetTokenReturned) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Read state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 uniV3LiquidityAmount, , , , ) = uniswapV3NftManager
      .positions(nftTokenId);

    // Translate state
    uint256 liquidityAmount = SafeCast.toUint256(
      SafeCast.toInt256(uniV3LiquidityAmount)
    );

    // Collect tokens and fees from the LP NFT
    (
      uint256 gameTokenCollected,
      uint256 assetTokenCollected
    ) = _collectTokensAndFees(nftTokenId, uniV3LiquidityAmount);

    // Track token amount
    uint256 assetTokenAmount = assetTokenCollected;

    // Swap the game token for the asset token
    if (gameTokenCollected > 0) {
      uint256 assetTokenBought = _sellGameToken(gameTokenCollected);

      // Update token balance
      assetTokenAmount += assetTokenBought;
    }

    // Return the asset token from this contract
    _returnAssetToken(assetTokenAmount, recipient);

    // Return the LP NFT to the recipient
    uniswapV3NftManager.safeTransferFrom(_msgSender(), recipient, nftTokenId);

    // Dispatch event
    // slither-disable-next-line reentrancy-events
    emit NFTCollected(
      _msgSender(),
      recipient,
      address(uniswapV3NftManager),
      nftTokenId,
      liquidityAmount,
      gameTokenCollected,
      assetTokenCollected,
      assetTokenReturned
    );

    return assetTokenReturned;
  }

  /**
   * @dev See {IUniV3Pooler-exit}
   */
  function exit(
    uint256 nftTokenId
  ) public override returns (uint256 assetTokenReturned) {
    // Collect and transfer the LP NFT back to the sender
    assetTokenReturned = collectFromNFT(nftTokenId, _msgSender());

    return assetTokenReturned;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Transfer tokens to this contract
   *
   * @param gameTokenAmount The amount of the game token to transfer
   * @param assetTokenAmount The amount of the asset token to transfer
   */
  function _receiveTokens(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount
  ) private {
    // Call external contracts
    if (gameTokenAmount > 0) {
      gameToken.safeTransferFrom(_msgSender(), address(this), gameTokenAmount);
    }
    if (assetTokenAmount > 0) {
      assetToken.safeTransferFrom(
        _msgSender(),
        address(this),
        assetTokenAmount
      );
    }
  }

  /**
   * @dev Approve the NFT manager to spend the tokens
   *
   * @param gameTokenAmount The amount of the game token to approve
   * @param assetTokenAmount The amount of the asset token to approve
   */
  function _approveTokens(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount
  ) private {
    // Call external contracts
    if (gameTokenAmount > 0) {
      gameToken.safeIncreaseAllowance(
        address(uniswapV3NftManager),
        gameTokenAmount
      );
    }
    if (assetTokenAmount > 0) {
      assetToken.safeIncreaseAllowance(
        address(uniswapV3NftManager),
        assetTokenAmount
      );
    }
  }

  /**
   * @dev Buy the game token with the asset token
   *
   * @param assetSwapAmount The amount of the asset token to swap into the
   *                        game token
   *
   * @return gameTokenBought The amount of the game token bought
   */
  function _buyGameToken(
    uint256 assetSwapAmount
  ) private returns (uint256 gameTokenBought) {
    // slither-disable-next-line timestamp
    if (assetSwapAmount > 0) {
      // Approve the swapper to spend the asset token
      assetToken.safeIncreaseAllowance(address(uniV3Swapper), assetSwapAmount);

      // Buy the game token
      gameTokenBought = uniV3Swapper.buyGameToken(
        assetSwapAmount,
        address(this)
      );
    }

    return gameTokenBought;
  }

  /**
   * @dev Sell the game token for the asset token
   *
   * @param gameSwapAmount The amount of the game token to swap into the
   *                       asset token
   *
   * @return assetTokenBought The amount of the asset token bought
   */
  function _sellGameToken(
    uint256 gameSwapAmount
  ) private returns (uint256 assetTokenBought) {
    if (gameSwapAmount > 0) {
      // Approve the swapper to spend the game token
      gameToken.safeIncreaseAllowance(address(uniV3Swapper), gameSwapAmount);

      // Buy the asset token
      assetTokenBought = uniV3Swapper.sellGameToken(
        gameSwapAmount,
        address(this)
      );
    }

    return assetTokenBought;
  }

  /**
   * @dev Mint an LP NFT
   *
   * @param gameTokenAmount The amount of the game token to add to the pool
   * @param assetTokenAmount The amount of the asset token to add to the pool
   * @param recipient The recipient of the minted LP NFT
   *
   * @return nftTokenId The ID of the minted LP NFT
   */
  function _mintLpNftImbalance(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address recipient
  ) private returns (uint256 nftTokenId) {
    // Approve the NFT manager to spend the game and asset tokens
    _approveTokens(gameTokenAmount, assetTokenAmount);

    // Get the pool fee
    uint24 poolFee = uniswapV3Pool.fee();

    // Mint the LP NFT
    uint256 liquidityAmount;
    uint256 amount0;
    uint256 amount1;
    (nftTokenId, liquidityAmount, amount0, amount1) = uniswapV3NftManager.mint(
      INonfungiblePositionManager.MintParams({
        token0: gameIsToken0 ? address(gameToken) : address(assetToken),
        token1: gameIsToken0 ? address(assetToken) : address(gameToken),
        fee: poolFee,
        tickLower: TICK_LOWER,
        tickUpper: TICK_UPPER,
        amount0Desired: gameIsToken0 ? gameTokenAmount : assetTokenAmount,
        amount1Desired: gameIsToken0 ? assetTokenAmount : gameTokenAmount,
        amount0Min: 0,
        amount1Min: 0,
        recipient: recipient,
        // slither-disable-next-line timestamp
        deadline: block.timestamp
      })
    );

    // Calculate results
    uint256 gameTokenShare = gameIsToken0 ? amount0 : amount1;
    uint256 assetTokenShare = gameIsToken0 ? amount1 : amount0;

    // Dispatch event
    emit NFTMinted(
      _msgSender(),
      recipient,
      address(uniswapV3NftManager),
      nftTokenId,
      gameTokenShare,
      assetTokenShare,
      liquidityAmount
    );

    return nftTokenId;
  }

  /**
   * @dev Collect tokens and fees from an LP NFT
   *
   * @param nftTokenId The ID of the LP NFT
   * @param liquidityAmount The amount of liquidity to collect
   *
   * @return gameTokenCollected The amount of the game token collected
   * @return assetTokenCollected The amount of the asset token collected
   */
  function _collectTokensAndFees(
    uint256 nftTokenId,
    uint128 liquidityAmount
  ) private returns (uint256 gameTokenCollected, uint256 assetTokenCollected) {
    if (liquidityAmount > 0) {
      // Withdraw tokens from the pool
      // slither-disable-next-line unused-return
      uniswapV3NftManager.decreaseLiquidity(
        INonfungiblePositionManager.DecreaseLiquidityParams({
          tokenId: nftTokenId,
          liquidity: liquidityAmount,
          amount0Min: 0,
          amount1Min: 0,
          // slither-disable-next-line timestamp
          deadline: block.timestamp
        })
      );
    }

    // Collect the tokens and fees
    (uint256 amount0, uint256 amount1) = uniswapV3NftManager.collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: nftTokenId,
        recipient: address(this),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    // Calculate results
    gameTokenCollected = gameIsToken0 ? amount0 : amount1;
    assetTokenCollected = gameIsToken0 ? amount1 : amount0;

    return (gameTokenCollected, assetTokenCollected);
  }

  /**
   * @dev Return the game token to the recipient
   *
   * @param recipient The recipient of the game token
   * @param gameTokenAmount The amount of the game token to return
   */
  function _returnGameToken(
    address recipient,
    uint256 gameTokenAmount
  ) private {
    // Call external contracts
    // slither-disable-next-line timestamp
    if (gameTokenAmount > 0) {
      gameToken.safeTransfer(recipient, gameTokenAmount);
    }
  }

  /**
   * @dev Return the asset token to the recipient
   *
   * @param assetTokenAmount Amount of the asset token to transfer
   * @param recipient Address to transfer the asset token to
   */
  function _returnAssetToken(
    uint256 assetTokenAmount,
    address recipient
  ) private {
    // Call external contracts
    if (assetTokenAmount > 0) {
      assetToken.safeTransfer(recipient, assetTokenAmount);
    }
  }

  /**
   * @dev Return any game or asset token dust to the recipient
   *
   * @param recipient The recipient of the dust
   */
  function _returnDust(address recipient) private {
    // Swap the asset token dust into the game token
    uint256 assetTokenDust = assetToken.balanceOf(address(this));
    if (assetTokenDust > 0) {
      _buyGameToken(assetTokenDust);
    }

    // Return the game token dust to the recipient
    uint256 gameTokenDust = gameToken.balanceOf(address(this));
    if (gameTokenDust > 0) _returnGameToken(recipient, gameTokenDust);
  }
}

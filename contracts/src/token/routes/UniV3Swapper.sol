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
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IUniswapV3SwapCallback} from "../../../interfaces/uniswap-v3-core/callback/IUniswapV3SwapCallback.sol";
import {IUniswapV3Pool} from "../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";

import {IUniV3Swapper} from "../../interfaces/token/routes/IUniV3Swapper.sol";

/**
 * @dev Token router to swap between the game token and a yielding asset token
 */
contract UniV3Swapper is
  IUniV3Swapper,
  IUniswapV3SwapCallback,
  Context,
  ReentrancyGuard
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The minimum value that can be returned from {TickMath-getSqrtRatioAtTick}
   *
   * Equivalent to getSqrtRatioAtTick(MIN_TICK).
   */
  uint160 internal constant MIN_SQRT_RATIO = 4295128739;

  /**
   * @dev The maximum value that can be returned from {TickMath-getSqrtRatioAtTick}
   *
   * Equivalent to getSqrtRatioAtTick(MAX_TICK).
   */
  uint160 internal constant MAX_SQRT_RATIO =
    1461446703485210103287273052203988822378723970342;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The Uniswap V3 pool for the token pair
   */
  IUniswapV3Pool public immutable uniswapV3Pool;

  /**
   * @dev The game token
   */
  IERC20 public immutable gameToken;

  /**
   * @dev The asset token
   */
  IERC20 public immutable assetToken;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev True if the game token is sorted first in the Uniswap V3 pool, false
   * otherwise
   */
  bool public immutable gameIsToken0;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param uniswapV3Pool_ The address of the Uniswap V3 pool contract
   * @param gameToken_ The address of the game token of the protocol
   * @param assetToken_ The address of the asset token of the protocol
   */
  constructor(address uniswapV3Pool_, address gameToken_, address assetToken_) {
    // Validate parameters
    require(uniswapV3Pool_ != address(0), "Invalid pool");
    require(gameToken_ != address(0), "Invalid game");
    require(assetToken_ != address(0), "Invalid asset");

    // Read external contracts
    address token0 = IUniswapV3Pool(uniswapV3Pool_).token0();
    address token1 = IUniswapV3Pool(uniswapV3Pool_).token1();

    // Validate external contracts
    require(token0 != address(0), "Invalid token0");
    require(token1 != address(0), "Invalid token1");

    // Determine token order
    bool gameIsToken0_ = gameToken_ == token0;

    // Validate external contracts
    if (gameIsToken0_) {
      require(token0 == gameToken_, "Invalid token0");
      require(token1 == assetToken_, "Invalid token1");
    } else {
      require(token0 == assetToken_, "Invalid token0");
      require(token1 == gameToken_, "Invalid token1");
    }

    // Initialize routes
    uniswapV3Pool = IUniswapV3Pool(uniswapV3Pool_);
    gameToken = IERC20(gameToken_);
    assetToken = IERC20(assetToken_);

    // Initialize state
    gameIsToken0 = gameIsToken0_;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IUniV3Swapper}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IUniV3Swapper-buyGameToken}
   */
  function buyGameToken(
    uint256 assetTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 gameTokenReturned) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive the asset token
    _receiveAssetToken(assetTokenAmount);

    // Buy the game token
    gameTokenReturned = _buyGameToken(assetTokenAmount);

    // Return the game token
    _returnGameToken(gameTokenReturned, recipient);

    // Emit event
    // slither-disable-next-line reentrancy-events
    emit GameTokenBought(
      _msgSender(),
      recipient,
      assetTokenAmount,
      gameTokenReturned
    );

    return gameTokenReturned;
  }

  /**
   * @dev See {IUniV3Swapper-sellGameToken}
   */
  function sellGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 assetTokenReturned) {
    // Validate parameters
    require(gameTokenAmount > 0, "Invalid amount");
    require(recipient != address(0), "Invalid recipient");

    // Receive the game token
    _receiveGameToken(gameTokenAmount);

    // Sell the game token
    assetTokenReturned = _sellGameToken(gameTokenAmount);

    // Return the asset token
    _returnAssetToken(assetTokenReturned, recipient);

    // Dispatch event
    // slither-disable-next-line reentrancy-events
    emit GameTokenSold(
      _msgSender(),
      recipient,
      gameTokenAmount,
      assetTokenReturned
    );

    return assetTokenReturned;
  }

  /**
   * @dev See {IUniV3Swapper-exit}
   */
  function exit() public override returns (uint256 assetTokenReturned) {
    // Read state
    uint256 gameTokenAmount = gameToken.balanceOf(_msgSender());

    // Swap everything
    assetTokenReturned = sellGameToken(gameTokenAmount, _msgSender());

    return assetTokenReturned;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IUniswapV3SwapCallback}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IUniswapV3SwapCallback-uniswapV3SwapCallback}
   *
   * This function is called to the sender after a swap is executed on
   * Uniswap V3.
   *
   * The pool tokens owed for the swap must be payed. The caller of this
   * method must be checked to be a UniswapV3Pool deployed by the canonical
   * UniswapV3Factory.
   *
   * amount0Delta and amount1Delta can both be 0 if no tokens were swapped.
   */
  function uniswapV3SwapCallback(
    // slither-disable-next-line similar-names
    int256 amount0Delta,
    int256 amount1Delta,
    bytes calldata
  ) public override {
    // Validate caller
    require(_msgSender() == address(uniswapV3Pool), "Invalid caller");

    // Pay fees
    if (amount0Delta > 0) {
      IERC20(IUniswapV3Pool(_msgSender()).token0()).safeTransfer(
        _msgSender(),
        uint256(amount0Delta)
      );
    }
    if (amount1Delta > 0) {
      IERC20(IUniswapV3Pool(_msgSender()).token1()).safeTransfer(
        _msgSender(),
        uint256(amount1Delta)
      );
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Procure the game token from the sender
   *
   * @param gameTokenAmount Amount of the game token to transfer
   */
  function _receiveGameToken(uint256 gameTokenAmount) private {
    // Call external contracts
    if (gameTokenAmount > 0) {
      gameToken.safeTransferFrom(_msgSender(), address(this), gameTokenAmount);
    }
  }

  /**
   * @dev Procure the asset token from the sender
   *
   * @param assetTokenAmount Amount of the asset token to transfer
   */
  function _receiveAssetToken(uint256 assetTokenAmount) private {
    // Call external contracts
    if (assetTokenAmount > 0) {
      assetToken.safeTransferFrom(
        _msgSender(),
        address(this),
        assetTokenAmount
      );
    }
  }

  /**
   * @dev Buy the game token with the asset token
   *
   * @param assetTokenAmount Amount of the asset token to spend
   *
   * @return gameTokenReturned Amount of the game token received
   */
  function _buyGameToken(
    uint256 assetTokenAmount
  ) private returns (uint256 gameTokenReturned) {
    // Approve Uniswap V3 pool to spend the asset token
    assetToken.safeIncreaseAllowance(address(uniswapV3Pool), assetTokenAmount);

    //
    // Swap the asset token for the game token
    //
    // A note about amount0 and amount1:
    //
    // amount0 is the delta of the balance of token0 of the pool
    // amount1 is the delta of the balance of token1 of the pool
    //
    // Amounts are exact when negative, minimum when positive.
    //
    bool zeroForOne = gameIsToken0 ? false : true;
    (int256 amount0, int256 amount1) = uniswapV3Pool.swap(
      address(this),
      zeroForOne,
      SafeCast.toInt256(assetTokenAmount),
      gameIsToken0 ? MAX_SQRT_RATIO - 1 : MIN_SQRT_RATIO + 1, // TODO
      ""
    );

    // Calculate game token amount
    gameTokenReturned = gameIsToken0
      ? SafeCast.toUint256(-amount0)
      : SafeCast.toUint256(-amount1);

    return gameTokenReturned;
  }

  /**
   * @dev Sell the game token for the asset token
   *
   * @param gameTokenAmount Amount of the game token to spend
   *
   * @return assetTokenReturned Amount of the asset token received
   */
  function _sellGameToken(
    uint256 gameTokenAmount
  ) private returns (uint256 assetTokenReturned) {
    // Approve Uniswap V3 pool to spend the game token
    gameToken.safeIncreaseAllowance(address(uniswapV3Pool), gameTokenAmount);

    //
    // Swap the game token for the asset token
    //
    // A note about amount0 and amount1:
    //
    // amount0 is the delta of the balance of token0 of the pool
    // amount1 is the delta of the balance of token1 of the pool
    //
    // Amounts are exact when negative, minimum when positive.
    //
    bool zeroForOne = gameIsToken0 ? true : false;
    (int256 amount0, int256 amount1) = uniswapV3Pool.swap(
      address(this),
      zeroForOne,
      SafeCast.toInt256(gameTokenAmount),
      gameIsToken0 ? MIN_SQRT_RATIO + 1 : MAX_SQRT_RATIO - 1, // TODO
      ""
    );

    // Calculate asset token amount
    assetTokenReturned = gameIsToken0
      ? SafeCast.toUint256(-amount1)
      : SafeCast.toUint256(-amount0);

    return assetTokenReturned;
  }

  /**
   * @dev Return the game token to the recipient
   *
   * @param gameTokenAmount Amount of the game token to transfer
   * @param recipient Address to transfer the game token to
   */
  function _returnGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) private {
    // Transfer the token to the recipient
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
    // Transfer the token to the recipient
    if (assetTokenAmount > 0) {
      assetToken.safeTransfer(recipient, assetTokenAmount);
    }
  }
}

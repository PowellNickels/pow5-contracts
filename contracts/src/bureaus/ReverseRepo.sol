/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IUniswapV3Pool} from "../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IReverseRepo} from "../interfaces/bureaus/IReverseRepo.sol";
import {IUniV3StakeFarm} from "../interfaces/defi/IUniV3StakeFarm.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";
import {IUniV3Pooler} from "../interfaces/token/routes/IUniV3Pooler.sol";
import {IUniV3Swapper} from "../interfaces/token/routes/IUniV3Swapper.sol";
import {LiquidityMath} from "../utils/math/LiquidityMath.sol";

/**
 * @title Bureau of the Reverse Repo
 */
contract ReverseRepo is
  ReentrancyGuard,
  AccessControl,
  ERC721Holder,
  ERC1155Holder,
  LiquidityMath,
  IReverseRepo
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The native game token
   */
  IERC20 public immutable gameToken;

  /**
   * @dev The yielding asset token
   */
  IERC20 public immutable assetToken;

  /**
   * @dev The LP-SFT contract
   */
  ILPSFT public immutable lpSft;

  /**
   * @dev The UniV3 pooler
   */
  IUniV3Pooler public immutable uniV3Pooler;

  /**
   * @dev The UniV3 swapper
   */
  IUniV3Swapper public immutable uniV3Swapper;

  /**
   * @dev The UniV3 stake farm
   */
  IUniV3StakeFarm public immutable uniV3StakeFarm;

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  /**
   * @dev The upstream Uniswap V3 pool
   */
  IUniswapV3Pool public immutable uniswapV3Pool;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Yield Harvest contract
   *
   * @param owner_ The owner of the Dutch Auction
   * @param gameToken_ The native game token
   * @param assetToken_ The yielding asset token
   * @param lpSft_ The LP-SFT token contract
   * @param uniV3Pooler_ The UniV3 pooler
   * @param uniV3Swapper_ The UniV3 swapper
   * @param uniV3StakeFarm_ The UniV3 stake farm
   * @param uniswapV3NftManager_ The upstream Uniswap V3 NFT manager
   * @param uniswapV3Pool_ The upstream Uniswap V3 pool
   */
  constructor(
    address owner_,
    address gameToken_,
    address assetToken_,
    address lpSft_,
    address uniV3Pooler_,
    address uniV3Swapper_,
    address uniV3StakeFarm_,
    address uniswapV3NftManager_,
    address uniswapV3Pool_
  ) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(gameToken_ != address(0), "Invalid game token");
    require(assetToken_ != address(0), "Invalid asset token");
    require(lpSft_ != address(0), "Invalid LP-SFT");
    require(uniV3Pooler_ != address(0), "Invalid pooler");
    require(uniV3Swapper_ != address(0), "Invalid swapper");
    require(uniV3StakeFarm_ != address(0), "Invalid farm");
    require(uniswapV3NftManager_ != address(0), "Invalid mgr");
    require(uniswapV3Pool_ != address(0), "Invalid pool");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    gameToken = IERC20(gameToken_);
    assetToken = IERC20(assetToken_);
    lpSft = ILPSFT(lpSft_);
    uniV3Pooler = IUniV3Pooler(uniV3Pooler_);
    uniV3StakeFarm = IUniV3StakeFarm(uniV3StakeFarm_);
    uniV3Swapper = IUniV3Swapper(uniV3Swapper_);
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
    uniswapV3Pool = IUniswapV3Pool(uniswapV3Pool_);

    // Approve the stake farm to transfer our LP-NFTs
    uniswapV3NftManager.setApprovalForAll(address(uniV3StakeFarm), true);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl} and {IReverseRepo}
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
    override(AccessControl, ERC1155Holder, IERC165)
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IERC721Receiver).interfaceId ||
      interfaceId == type(IReverseRepo).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IReverseRepo}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IReverseRepo-initialize}
   */
  function initialize(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 tokenId) {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate parameters
    require(gameTokenAmount > 0, "Invalid game amount");
    require(assetTokenAmount > 0, "Invalid asset amount");
    require(receiver != address(0), "Invalid receiver");

    // Call external contracts
    gameToken.safeTransferFrom(_msgSender(), address(this), gameTokenAmount);
    assetToken.safeTransferFrom(_msgSender(), address(this), assetTokenAmount);

    gameToken.safeIncreaseAllowance(address(uniV3Pooler), gameTokenAmount);
    assetToken.safeIncreaseAllowance(address(uniV3Pooler), assetTokenAmount);

    // Approve the stake farm to transfer our LP-NFTs
    lpSft.setApprovalForAll(address(uniV3StakeFarm), true);

    // Mint an LP-NFT
    tokenId = uniV3Pooler.mintNFTImbalance(
      gameTokenAmount,
      assetTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    uniV3StakeFarm.enter(tokenId);

    // Get newly-minted LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send game token dust to the receiver
    uint256 gameTokenDust = gameToken.balanceOf(address(this));
    if (gameTokenDust > 0) {
      gameToken.safeTransfer(receiver, gameTokenDust);
    }

    // Send asset token dust to the sender
    uint256 assetTokenDust = assetToken.balanceOf(address(this));
    if (assetTokenDust > 0) {
      assetToken.safeTransfer(receiver, assetTokenDust);
    }

    // Return the LP-SFT to the receiver
    lpSft.safeTransferFrom(address(this), receiver, tokenId, 1, "");

    return tokenId;
  }

  /**
   * @dev See {IReverseRepo-purchase}
   */
  function purchase(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 tokenId) {
    // Validate parameters
    require(gameTokenAmount > 0 || assetTokenAmount > 0, "Invalid amounts");
    require(receiver != address(0), "Invalid receiver");

    // Get the pool fee
    uint24 poolFee = uniswapV3Pool.fee();

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

    // Perform single-sided supply swap
    if (gameTokenAmount == 0) {
      // Get asset token reserve
      uint256 assetTokenReserve = assetToken.balanceOf(address(uniswapV3Pool));

      // Calculate asset swap amount
      uint256 assetSwapAmount = LiquidityMath.computeSwapAmountV2(
        assetTokenReserve,
        assetTokenAmount,
        poolFee
      );
      require(assetSwapAmount <= assetTokenAmount, "Bad liquidity math");

      // Approve swap
      assetToken.safeIncreaseAllowance(address(uniV3Swapper), assetSwapAmount);

      // Perform swap
      gameTokenAmount = uniV3Swapper.buyGameToken(
        assetSwapAmount,
        address(this)
      );

      // Update amount
      assetTokenAmount -= assetSwapAmount;
    } else if (assetTokenAmount == 0) {
      // Get game token reserve
      uint256 gameTokenReserve = gameToken.balanceOf(address(uniswapV3Pool));

      // Calculate game swap amount
      uint256 gameSwapAmount = LiquidityMath.computeSwapAmountV2(
        gameTokenReserve,
        gameTokenAmount,
        poolFee
      );
      require(gameSwapAmount <= gameTokenAmount, "Bad liquidity math");

      // Approve swap
      gameToken.safeIncreaseAllowance(address(uniV3Swapper), gameSwapAmount);

      // Perform swap
      assetTokenAmount = uniV3Swapper.sellGameToken(
        gameSwapAmount,
        address(this)
      );

      // Update amount
      gameTokenAmount -= gameSwapAmount;
    }

    // Validate state
    require(gameTokenAmount > 0 || assetTokenAmount > 0, "Invalid liquidity");

    // Approve tokens
    if (gameTokenAmount > 0) {
      gameToken.safeIncreaseAllowance(address(uniV3Pooler), gameTokenAmount);
    }
    if (assetTokenAmount > 0) {
      assetToken.safeIncreaseAllowance(address(uniV3Pooler), assetTokenAmount);
    }

    // Mint an LP-NFT
    tokenId = uniV3Pooler.mintNFTImbalance(
      gameTokenAmount,
      assetTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    uniV3StakeFarm.enter(tokenId);

    // Get newly-minted LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send game token dust to the receiver
    uint256 gameTokenDust = gameToken.balanceOf(address(this));
    if (gameTokenDust > 0) {
      gameToken.safeTransfer(receiver, gameTokenDust);
    }

    // Send asset token dust to the receiver
    uint256 assetTokenDust = assetToken.balanceOf(address(this));
    if (assetTokenDust > 0) {
      assetToken.safeTransfer(receiver, assetTokenDust);
    }

    // Return the LP-SFT to the receiver
    lpSft.safeTransferFrom(address(this), receiver, tokenId, 1, "");

    return tokenId;
  }

  /**
   * @dev See {IReverseRepo-exit}
   */
  function exit(uint256 tokenId) external override nonReentrant {
    // Call external contracts
    lpSft.safeTransferFrom(_msgSender(), address(this), tokenId, 1, "");

    // Withdraw the LP-NFT from the stake farm
    uniV3StakeFarm.exit(tokenId);

    // Read state
    uint256 gameTokenBalance = gameToken.balanceOf(address(this));

    // Swap any game tokens to asset tokens
    if (gameTokenBalance > 0) {
      gameToken.safeIncreaseAllowance(address(uniV3Swapper), gameTokenBalance);
      // slither-disable-next-line unused-return
      uniV3Swapper.sellGameToken(gameTokenBalance, address(this));
    }

    // Read state
    uint256 assetTokenBalance = assetToken.balanceOf(address(this));

    // Return any tokens to the sender
    if (assetTokenBalance > 0) {
      assetToken.safeTransfer(_msgSender(), assetTokenBalance);
    }

    // Return the empty LP-NFT to the sender
    uniswapV3NftManager.safeTransferFrom(
      address(this),
      _msgSender(),
      tokenId,
      ""
    );
  }
}

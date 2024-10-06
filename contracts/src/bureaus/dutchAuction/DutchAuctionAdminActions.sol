/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IDutchAuctionAdminActions} from "../../interfaces/bureaus/dutchAuction/IDutchAuctionAdminActions.sol";
import {VRGDAMath} from "../../utils/math/VRGDAMath.sol";

import {DutchAuctionBase} from "./DutchAuctionBase.sol";

/**
 * @title Bureau of the Dutch Auction
 */
abstract contract DutchAuctionAdminActions is
  Context,
  ReentrancyGuard,
  AccessControl,
  DutchAuctionBase,
  IDutchAuctionAdminActions
{
  using EnumerableSet for EnumerableSet.UintSet;
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialization flag
   */
  bool private _initialized = false;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Dutch Auction contract
   *
   * @param owner_ The owner of the Dutch Auction
   */
  constructor(address owner_) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl}, {DutchAuctionBase} and
  // {IDutchAuctionAdminActions}
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
    override(AccessControl, DutchAuctionBase, IERC165)
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IDutchAuctionAdminActions).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionAdminActions}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuctionAdminActions-initialize}
   */
  function initialize(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 lpNftTokenId) {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate parameters
    require(gameTokenAmount > 0, "Invalid game amount");
    require(assetTokenAmount > 0, "Invalid asset amount");
    require(receiver != address(0), "Invalid receiver");

    // Validate state
    require(!_initialized, "Already initialized");

    // Update state
    _initialized = true;

    // Call external contracts
    _gameToken.safeTransferFrom(_msgSender(), address(this), gameTokenAmount);
    _assetToken.safeTransferFrom(_msgSender(), address(this), assetTokenAmount);

    // Mint LP-NFT
    lpNftTokenId = _mintLpNft(gameTokenAmount, assetTokenAmount);

    // Stake LP-NFT in the stake farm
    _uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(_lpNftStakeFarm),
      lpNftTokenId,
      ""
    );

    // Get newly-minted LP-SFT address
    address lpSftAddress = _lpSft.tokenIdToAddress(lpNftTokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send game token dust to the LP-SFT
    uint256 gameTokenDust = _gameToken.balanceOf(address(this));
    if (gameTokenDust > 0) {
      _gameToken.safeTransfer(lpSftAddress, gameTokenDust);
    }

    // Send asset token dust to the receiver
    uint256 assetTokenDust = _assetToken.balanceOf(address(this));
    if (assetTokenDust > 0) {
      _assetToken.safeTransfer(receiver, assetTokenDust);
    }

    // Return the LP-SFT to the receiver
    _lpSft.safeTransferFrom(address(this), receiver, lpNftTokenId, 1, "");

    // Emit event
    emit AuctionInitialized(
      lpNftTokenId,
      gameTokenAmount,
      assetTokenAmount,
      _msgSender(),
      receiver
    );

    return lpNftTokenId;
  }

  /**
   * @dev See {IDutchAuctionAdminActions-isInitialized}
   */
  function isInitialized() external view override returns (bool) {
    // Read state
    return _initialized;
  }

  /**
   * @dev See {IDutchAuctionAdminActions-createAuction}
   */
  function createAuction(
    VRGDAParams calldata vrgdaParams,
    uint256 dustLossAmount
  ) external override nonReentrant {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Get token balances
    uint256 gameTokenBalance = _gameToken.balanceOf(address(this));
    uint256 assetTokenBalance = _assetToken.balanceOf(address(this));

    // Mint an LP-NFT
    // slither-disable-next-line reentrancy-benign
    uint256 lpNftTokenId = _mintLpNft(gameTokenBalance, assetTokenBalance);

    // Update state
    require(_activeAuctions.add(lpNftTokenId), "Already added");
    AuctionSlot storage auctionSlot = _auctions[lpNftTokenId];
    auctionSlot.lpNftTokenId = lpNftTokenId;
    auctionSlot.auctionStartTime = block.timestamp;
    auctionSlot.vrgdaParams = vrgdaParams;

    // Allow at most a small loss of the game token
    require(
      _gameToken.balanceOf(address(this)) + dustLossAmount >= gameTokenBalance,
      "Game token loss"
    );

    // Allow at most a small loss of the asset token
    require(
      _assetToken.balanceOf(address(this)) + dustLossAmount >=
        assetTokenBalance,
      "Asset token loss"
    );

    // Emit event
    emit AuctionCreated(lpNftTokenId, block.timestamp, vrgdaParams);
  }
}

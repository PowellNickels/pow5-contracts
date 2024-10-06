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
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuctionAdminActions} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionAdminActions.sol";
import {VRGDA} from "../../utils/auction/VRGDA.sol";

import {DutchAuctionBase} from "./DutchAuctionBase.sol";

/**
 * @title Bureau of the Dutch Auction
 */
abstract contract DutchAuctionAdminActions is
  IDutchAuctionAdminActions,
  DutchAuctionBase
{
  using SafeERC20 for IERC20;

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
  // Implementation of {IERC165} via {AccessControl},
  // {IDutchAuctionAdminActions}, {DutchAuctionRoutes} and {DutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, DutchAuctionBase) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IDutchAuctionAdminActions).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionAdminActions}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuction-initialize}
   */
  function initialize(
    uint256 pow1Amount,
    uint256 marketTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 nftTokenId) {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate parameters
    require(pow1Amount > 0, "Invalid POW1 amount");
    require(marketTokenAmount > 0, "Invalid market amount");
    require(receiver != address(0), "Invalid receiver");

    // Validate state
    require(!_initialized, "Already initialized");

    // Update state
    _initialized = true;

    // Call external contracts
    _routes.pow1Token.safeTransferFrom(_msgSender(), address(this), pow1Amount);
    _routes.marketToken.safeTransferFrom(
      _msgSender(),
      address(this),
      marketTokenAmount
    );

    _routes.pow1Token.safeIncreaseAllowance(
      address(_routes.pow1MarketPooler),
      pow1Amount
    );
    _routes.marketToken.safeIncreaseAllowance(
      address(_routes.pow1MarketPooler),
      marketTokenAmount
    );

    // Mint an LP-NFT
    nftTokenId = _routes.pow1MarketPooler.mintLpNftImbalance(
      pow1Amount,
      marketTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    _routes.uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(_routes.pow1LpNftStakeFarm),
      nftTokenId,
      ""
    );

    // Get newly-minted LP-SFT address
    address lpSftAddress = _routes.lpSft.tokenIdToAddress(nftTokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send POW1 dust to the LP-SFT
    uint256 pow1Dust = _routes.pow1Token.balanceOf(address(this));
    if (pow1Dust > 0) {
      _routes.pow1Token.safeTransfer(lpSftAddress, pow1Dust);
    }

    // Send asset token dust to the receiver
    uint256 marketTokenDust = _routes.marketToken.balanceOf(address(this));
    if (marketTokenDust > 0) {
      _routes.marketToken.safeTransfer(receiver, marketTokenDust);
    }

    // Return the LP-SFT to the receiver
    _routes.lpSft.safeTransferFrom(address(this), receiver, nftTokenId, 1, "");

    return nftTokenId;
  }

  /**
   * @dev See {IDutchAuctionAdminActions-isInitialized}
   */
  function isInitialized() external view override returns (bool) {
    // Read state
    return _initialized;
  }

  /**
   * @dev See {IDutchAuctionAdminActions-setAuction}
   */
  function setAuction(
    uint256 slot,
    int256 targetPrice,
    int256 priceDecayConstant,
    uint256 dustLossAmount
  ) external override nonReentrant {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate parameters
    // TODO

    // Validate state
    require(address(_slotToAuction[slot]) == address(0), "Auction exists");
    require(_slotToLpNft[slot] == 0, "NFT exists");

    // Create the auction
    VRGDA auction = new VRGDA(targetPrice, priceDecayConstant);

    // Get token balances, as Uniswap V3 can't mint a token with zero liquidity
    uint256 pow1Balance = _routes.pow1Token.balanceOf(address(this));
    uint256 marketTokenBalance = _routes.marketToken.balanceOf(address(this));

    // Approve pooler to spend tokens
    // slither-disable-next-line reentrancy-no-eth
    _routes.pow1Token.safeIncreaseAllowance(
      address(_routes.pow1MarketPooler),
      pow1Balance
    );
    // slither-disable-next-line reentrancy-no-eth
    _routes.marketToken.safeIncreaseAllowance(
      address(_routes.pow1MarketPooler),
      marketTokenBalance
    );

    // Mint an LP-NFT
    // slither-disable-next-line reentrancy-no-eth
    uint256 nftTokenId = _routes.pow1MarketPooler.mintLpNftImbalance(
      pow1Balance,
      marketTokenBalance,
      address(this)
    );

    // Update state
    _slotToAuction[slot] = auction;
    _slotToLpNft[slot] = nftTokenId;

    // Read state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 liquidityAmount, , , , ) = _routes
      .uniswapV3NftManager
      .positions(nftTokenId);

    // Withdraw tokens from the pool
    // slither-disable-next-line unused-return
    _routes.uniswapV3NftManager.decreaseLiquidity(
      INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: nftTokenId,
        liquidity: liquidityAmount,
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
        tokenId: nftTokenId,
        recipient: address(this),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    // Allow at most a small loss of the POW1
    require(
      _routes.pow1Token.balanceOf(address(this)) + dustLossAmount >=
        pow1Balance,
      "Game token loss"
    );

    // Allow at most a small loss of the POW1
    require(
      _routes.pow1Token.balanceOf(address(this)) + dustLossAmount >=
        pow1Balance,
      "Game token loss"
    );

    // Allow at most a small loss of the market token
    require(
      _routes.marketToken.balanceOf(address(this)) + dustLossAmount >=
        marketTokenBalance,
      "Asset token loss"
    );

    // Emit event
    // TODO
  }

  /**
   * @dev See {IDutchAuctionAdminActions-removeAuction}
   */
  function removeAuction(uint256 slot) external nonReentrant {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Read state
    uint256 nftTokenId = _slotToLpNft[slot];

    // Update state
    delete _slotToAuction[slot];
    delete _slotToLpNft[slot];

    // Call external contracts
    if (nftTokenId != 0) {
      // Return the empty LP-NFT to the sender
      _routes.uniswapV3NftManager.safeTransferFrom(
        address(this),
        _msgSender(),
        nftTokenId,
        ""
      );
    }
  }
}

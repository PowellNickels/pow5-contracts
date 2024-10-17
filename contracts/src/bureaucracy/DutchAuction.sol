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
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IUniswapV3Pool} from "../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuction} from "../interfaces/bureaucracy/IDutchAuction.sol";
import {ITheReserve} from "../interfaces/bureaucracy/theReserve/ITheReserve.sol";
import {ILPNFTStakeFarm} from "../interfaces/defi/ILPNFTStakeFarm.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";
import {IGameTokenPooler} from "../interfaces/token/routes/IGameTokenPooler.sol";
import {IGameTokenSwapper} from "../interfaces/token/routes/IGameTokenSwapper.sol";
import {VRGDA} from "../utils/auction/VRGDA.sol";
import {LiquidityMath} from "../utils/math/LiquidityMath.sol";

/**
 * @title Bureau of the Dutch Auction
 */
contract DutchAuction is
  Context,
  ReentrancyGuard,
  AccessControl,
  ERC721Holder,
  ERC1155Holder,
  IDutchAuction
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The Reserve smart contract
   */
  ITheReserve public immutable theReserve;

  /**
   * @dev The POW1 token
   */
  IERC20 public immutable pow1Token;

  /**
   * @dev The market token
   */
  IERC20 public immutable marketToken;

  /**
   * @dev The upstream Uniswap V3 pool for the POW1/market token pair
   */
  IUniswapV3Pool public immutable pow1MarketPool;

  /**
   * @dev The POW1 swapper
   */
  IGameTokenSwapper public immutable pow1MarketSwapper;

  /**
   * @dev The POW1 pooler
   */
  IGameTokenPooler public immutable pow1MarketPooler;

  /**
   * @dev The POW1 LP-NFT stake farm
   */
  ILPNFTStakeFarm public immutable pow1LpNftStakeFarm;

  /**
   * @dev The LP-SFT contract
   */
  ILPSFT public immutable lpSft;

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialization flag
   */
  bool private _initialized = false;

  /**
   * @dev Mapping from auction slot to auction
   */
  mapping(uint256 slot => VRGDA auction) private _slotToAuction;

  /**
   * @dev Mapping from auction slot to LP-NFT ID
   */
  mapping(uint256 slot => uint256 tokenId) private _slotToLpNft;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Dutch Auction contract
   *
   * @param owner_ The owner of the Dutch Auction
   * @param theReserve_ The Reserve smart contract address
   */
  constructor(address owner_, address theReserve_) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(theReserve_ != address(0), "Invalid The Reserve");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    theReserve = ITheReserve(theReserve_);
    pow1Token = ITheReserve(theReserve_).pow1Token();
    marketToken = ITheReserve(theReserve_).marketToken();
    pow1MarketPool = ITheReserve(theReserve_).pow1MarketPool();
    pow1MarketSwapper = ITheReserve(theReserve_).pow1MarketSwapper();
    pow1MarketPooler = ITheReserve(theReserve_).pow1MarketPooler();
    pow1LpNftStakeFarm = ITheReserve(theReserve_).pow1LpNftStakeFarm();
    lpSft = ITheReserve(theReserve_).lpSft();
    uniswapV3NftManager = ITheReserve(theReserve_).uniswapV3NftManager();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl}, {ERC1155Holder} and
  // {IDutchAuction}
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
      interfaceId == type(IDutchAuction).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuction}
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
    pow1Token.safeTransferFrom(_msgSender(), address(this), pow1Amount);
    marketToken.safeTransferFrom(
      _msgSender(),
      address(this),
      marketTokenAmount
    );

    pow1Token.safeIncreaseAllowance(address(pow1MarketPooler), pow1Amount);
    marketToken.safeIncreaseAllowance(
      address(pow1MarketPooler),
      marketTokenAmount
    );

    // Mint an LP-NFT
    nftTokenId = pow1MarketPooler.mintLpNftImbalance(
      pow1Amount,
      marketTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(pow1LpNftStakeFarm),
      nftTokenId,
      ""
    );

    // Get newly-minted LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(nftTokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send POW1 dust to the LP-SFT
    uint256 pow1Dust = pow1Token.balanceOf(address(this));
    if (pow1Dust > 0) {
      pow1Token.safeTransfer(lpSftAddress, pow1Dust);
    }

    // Send asset token dust to the receiver
    uint256 marketTokenDust = marketToken.balanceOf(address(this));
    if (marketTokenDust > 0) {
      marketToken.safeTransfer(receiver, marketTokenDust);
    }

    // Return the LP-SFT to the receiver
    lpSft.safeTransferFrom(address(this), receiver, nftTokenId, 1, "");

    return nftTokenId;
  }

  /**
   * @dev See {IDutchAuction-isInitialized}
   */
  function isInitialized() external view override returns (bool) {
    // Read state
    return _initialized;
  }

  /**
   * @dev See {IDutchAuction-setAuction}
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
    uint256 pow1Balance = pow1Token.balanceOf(address(this));
    uint256 marketTokenBalance = marketToken.balanceOf(address(this));

    // Approve pooler to spend tokens
    pow1Token.safeIncreaseAllowance(address(pow1MarketPooler), pow1Balance);
    marketToken.safeIncreaseAllowance(
      address(pow1MarketPooler),
      marketTokenBalance
    );

    // Mint an LP-NFT
    // slither-disable-next-line reentrancy-no-eth
    uint256 nftTokenId = pow1MarketPooler.mintLpNftImbalance(
      pow1Balance,
      marketTokenBalance,
      address(this)
    );

    // Update state
    _slotToAuction[slot] = auction;
    _slotToLpNft[slot] = nftTokenId;

    // Read state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 liquidityAmount, , , , ) = uniswapV3NftManager
      .positions(nftTokenId);

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

    // Collect the tokens and fees
    // slither-disable-next-line unused-return
    uniswapV3NftManager.collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: nftTokenId,
        recipient: address(this),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    // Allow at most a small loss of the POW1
    require(
      pow1Token.balanceOf(address(this)) + dustLossAmount >= pow1Balance,
      "Game token loss"
    );

    // Allow at most a small loss of the asset token
    require(
      marketToken.balanceOf(address(this)) + dustLossAmount >=
        marketTokenBalance,
      "Asset token loss"
    );

    // Emit event
    // TODO
  }

  /**
   * @dev See {IDutchAuction-removeAuction}
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
      uniswapV3NftManager.safeTransferFrom(
        address(this),
        _msgSender(),
        nftTokenId,
        ""
      );
    }
  }

  /**
   * @dev See {IDutchAuction-getPrice}
   */
  function getPrice(uint256 slot) external view returns (uint256) {
    // Read state
    VRGDA auction = _slotToAuction[slot];

    // Calculate the auction price
    int256 timeSinceStart = 0; // TODO
    uint256 sold = 0; // TODO
    return auction.getVRGDAPrice(timeSinceStart, sold);
  }

  /**
   * @dev See {IDutchAuction-purchase}
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
    uint24 poolFee = pow1MarketPool.fee();

    // Validate state
    require(pow1TipAmount > 0 || marketTipAmount > 0, "Invalid tips");
    require(
      pow1LiquidityAmount > 0 || marketLiquidityAmount > 0,
      "Invalid liquidity"
    );

    // Call external contracts
    if (pow1Amount > 0) {
      pow1Token.safeTransferFrom(_msgSender(), address(this), pow1Amount);
    }
    if (marketTokenAmount > 0) {
      marketToken.safeTransferFrom(
        _msgSender(),
        address(this),
        marketTokenAmount
      );
    }

    // Perform single-sided supply swap
    if (pow1LiquidityAmount == 0) {
      // Get asset token reserve
      uint256 marketTokenReserve = marketToken.balanceOf(
        address(pow1MarketPool)
      );

      // Calculate asset swap amount
      uint256 assetSwapAmount = LiquidityMath.computeSwapAmountV2(
        marketTokenReserve,
        marketLiquidityAmount,
        poolFee
      );
      require(assetSwapAmount <= marketLiquidityAmount, "Bad liquidity math");

      // Approve swap
      marketToken.safeIncreaseAllowance(
        address(pow1MarketSwapper),
        assetSwapAmount
      );

      // Perform swap
      pow1LiquidityAmount = pow1MarketSwapper.buyGameToken(
        assetSwapAmount,
        address(this)
      );

      // Update amount
      marketLiquidityAmount -= assetSwapAmount;
    } else if (marketLiquidityAmount == 0) {
      // Get POW1 reserve
      uint256 pow1Reserve = pow1Token.balanceOf(address(pow1MarketPool));

      // Calculate game swap amount
      uint256 gameSwapAmount = LiquidityMath.computeSwapAmountV2(
        pow1Reserve,
        pow1LiquidityAmount,
        poolFee
      );
      require(gameSwapAmount <= pow1LiquidityAmount, "Bad liquidity math");

      // Approve swap
      pow1Token.safeIncreaseAllowance(
        address(pow1MarketSwapper),
        gameSwapAmount
      );

      // Perform swap
      marketLiquidityAmount = pow1MarketSwapper.sellGameToken(
        gameSwapAmount,
        address(this)
      );

      // Update amount
      pow1LiquidityAmount -= gameSwapAmount;
    }

    // Validate state
    require(
      pow1LiquidityAmount > 0 || marketLiquidityAmount > 0,
      "Invalid liquidity"
    );

    // Call external contracts
    if (pow1LiquidityAmount > 0) {
      pow1Token.safeIncreaseAllowance(
        address(uniswapV3NftManager),
        pow1LiquidityAmount
      );
    }
    if (marketLiquidityAmount > 0) {
      marketToken.safeIncreaseAllowance(
        address(uniswapV3NftManager),
        marketLiquidityAmount
      );
    }

    // Deposit liquidity
    // slither-disable-next-line unused-return
    uniswapV3NftManager.increaseLiquidity(
      INonfungiblePositionManager.IncreaseLiquidityParams({
        tokenId: nftTokenId,
        amount0Desired: address(pow1Token) < address(marketToken)
          ? pow1LiquidityAmount
          : marketLiquidityAmount,
        amount1Desired: address(pow1Token) < address(marketToken)
          ? marketLiquidityAmount
          : pow1LiquidityAmount,
        amount0Min: 0,
        amount1Min: 0,
        // slither-disable-next-line timestamp
        deadline: block.timestamp
      })
    );

    // Stake LP-NFT in the stake farm
    uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(pow1LpNftStakeFarm),
      nftTokenId,
      ""
    );

    // Return the LP-SFT to the receiver
    lpSft.safeTransferFrom(address(this), receiver, nftTokenId, 1, "");

    return nftTokenId;
  }

  /**
   * @dev See {IDutchAuction-exit}
   */
  function exit(uint256 tokenId) external override nonReentrant {
    // Validate parameters
    require(tokenId != 0, "Invalid token ID");

    // Validate state
    require(lpSft.ownerOf(tokenId) == _msgSender(), "Not LP-SFT owner");

    // Record POW1 balance to track any recovered from the LP-SFT
    uint256 pow1Balance = pow1Token.balanceOf(address(this));
    uint256 marketTokenBalance = marketToken.balanceOf(address(this));

    // Transfer the LP-SFT to the contract
    lpSft.safeTransferFrom(_msgSender(), address(this), tokenId, 1, "");

    // Transfer the LP-SFT to the LP-NFT stake farm
    lpSft.safeTransferFrom(
      address(this),
      address(pow1LpNftStakeFarm),
      tokenId,
      1,
      ""
    );

    // Read state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 liquidityAmount, , , , ) = uniswapV3NftManager
      .positions(tokenId);

    // Withdraw tokens from the pool
    // slither-disable-next-line unused-return
    uniswapV3NftManager.decreaseLiquidity(
      INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: tokenId,
        liquidity: liquidityAmount,
        amount0Min: 0,
        amount1Min: 0,
        // slither-disable-next-line timestamp
        deadline: block.timestamp
      })
    );

    // Collect the tokens and fees
    // slither-disable-next-line unused-return
    uniswapV3NftManager.collect(
      INonfungiblePositionManager.CollectParams({
        tokenId: tokenId,
        recipient: _msgSender(),
        amount0Max: type(uint128).max,
        amount1Max: type(uint128).max
      })
    );

    // Return the LP-NFT to the sender
    uniswapV3NftManager.safeTransferFrom(
      address(this),
      _msgSender(),
      tokenId,
      ""
    );

    // Return tokens recovered from burning the LP-SFT
    uint256 newPow1Balance = pow1Token.balanceOf(address(this));
    uint256 newMarketTokenBalance = marketToken.balanceOf(address(this));

    if (newPow1Balance > pow1Balance) {
      pow1Token.safeTransfer(address(this), newPow1Balance - pow1Balance);
    }
    if (newMarketTokenBalance > marketTokenBalance) {
      marketToken.safeTransfer(
        address(this),
        newMarketTokenBalance - marketTokenBalance
      );
    }

    // TODO: Emit event
  }
}

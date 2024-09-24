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

import {IDutchAuction} from "../interfaces/bureaus/IDutchAuction.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";
import {IUniV3Pooler} from "../interfaces/token/routes/IUniV3Pooler.sol";
import {IUniV3Swapper} from "../interfaces/token/routes/IUniV3Swapper.sol";
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
  LiquidityMath,
  IDutchAuction
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
   * @dev The LP-NFT stake farm
   */
  address public immutable lpNftStakeFarm;

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  /**
   * @dev The upstream Uniswap V3 pool
   */
  IUniswapV3Pool public immutable uniswapV3Pool;

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
   * @param gameToken_ The native game token
   * @param assetToken_ The yielding asset token
   * @param lpSft_ The LP-SFT contract
   * @param uniV3Pooler_ The UniV3 pooler
   * @param uniV3Swapper_ The UniV3 swapper
   * @param lpNftStakeFarm_ The LP-NFT stake farm
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
    address lpNftStakeFarm_,
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
    require(lpNftStakeFarm_ != address(0), "Invalid farm");
    require(uniswapV3NftManager_ != address(0), "Invalid mgr");
    require(uniswapV3Pool_ != address(0), "Invalid pool");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    gameToken = IERC20(gameToken_);
    assetToken = IERC20(assetToken_);
    lpSft = ILPSFT(lpSft_);
    uniV3Pooler = IUniV3Pooler(uniV3Pooler_);
    uniV3Swapper = IUniV3Swapper(uniV3Swapper_);
    lpNftStakeFarm = lpNftStakeFarm_;
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
    uniswapV3Pool = IUniswapV3Pool(uniswapV3Pool_);
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
      AccessControl.supportsInterface(interfaceId) ||
      ERC1155Holder.supportsInterface(interfaceId) ||
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
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 nftTokenId) {
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
    gameToken.safeTransferFrom(_msgSender(), address(this), gameTokenAmount);
    assetToken.safeTransferFrom(_msgSender(), address(this), assetTokenAmount);

    gameToken.safeIncreaseAllowance(address(uniV3Pooler), gameTokenAmount);
    assetToken.safeIncreaseAllowance(address(uniV3Pooler), assetTokenAmount);

    // Mint an LP-NFT
    nftTokenId = uniV3Pooler.mintNFTImbalance(
      gameTokenAmount,
      assetTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    uniswapV3NftManager.safeTransferFrom(
      address(this),
      lpNftStakeFarm,
      nftTokenId,
      ""
    );

    // Get newly-minted LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(nftTokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send game token dust to the LP-SFT
    uint256 gameTokenDust = gameToken.balanceOf(address(this));
    if (gameTokenDust > 0) {
      gameToken.safeTransfer(lpSftAddress, gameTokenDust);
    }

    // Send asset token dust to the receiver
    uint256 assetTokenDust = assetToken.balanceOf(address(this));
    if (assetTokenDust > 0) {
      assetToken.safeTransfer(receiver, assetTokenDust);
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
    uint256 gameTokenBalance = gameToken.balanceOf(address(this));
    uint256 assetTokenBalance = assetToken.balanceOf(address(this));

    // Approve pooler to spend tokens
    gameToken.safeIncreaseAllowance(address(uniV3Pooler), gameTokenBalance);
    assetToken.safeIncreaseAllowance(address(uniV3Pooler), assetTokenBalance);

    // Mint an LP-NFT
    // slither-disable-next-line reentrancy-no-eth
    uint256 nftTokenId = uniV3Pooler.mintNFTImbalance(
      gameTokenBalance,
      assetTokenBalance,
      address(this)
    );

    // Update state
    _slotToAuction[slot] = auction;
    _slotToLpNft[slot] = nftTokenId;

    // Read state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 uniV3LiquidityAmount, , , , ) = uniswapV3NftManager
      .positions(nftTokenId);

    // Withdraw tokens from the pool
    // slither-disable-next-line unused-return
    uniswapV3NftManager.decreaseLiquidity(
      INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: nftTokenId,
        liquidity: uniV3LiquidityAmount,
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

    // Allow at most a small loss of the game token
    require(
      gameToken.balanceOf(address(this)) + dustLossAmount >= gameTokenBalance,
      "Game token loss"
    );

    // Allow at most a small loss of the asset token
    require(
      assetToken.balanceOf(address(this)) + dustLossAmount >= assetTokenBalance,
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
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 nftTokenId) {
    // Validate parameters
    require(gameTokenAmount > 0 || assetTokenAmount > 0, "Invalid amounts");
    require(receiver != address(0), "Invalid receiver");

    // Read state
    VRGDA auction = _slotToAuction[slot];
    nftTokenId = _slotToLpNft[slot];

    int256 timeSinceStart = 1; // TODO
    uint256 sold = 0; // TODO
    // slither-disable-next-line divide-before-multiply
    uint256 creatorTipBips = auction.getVRGDAPrice(timeSinceStart, sold) / 1e18;

    // Calculate the auction tip
    uint256 gameTipAmount = (gameTokenAmount * creatorTipBips) / 1e4;
    uint256 assetTipAmount = (assetTokenAmount * creatorTipBips) / 1e4;

    // Calculate the deposited liquidity
    uint256 gameLiquidityAmount = gameTokenAmount - gameTipAmount;
    uint256 assetLiquidityAmount = assetTokenAmount - assetTipAmount;

    // Get the pool fee
    uint24 poolFee = uniswapV3Pool.fee();

    // Validate state
    require(gameTipAmount > 0 || assetTipAmount > 0, "Invalid tips");
    require(
      gameLiquidityAmount > 0 || assetLiquidityAmount > 0,
      "Invalid liquidity"
    );

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
    if (gameLiquidityAmount == 0) {
      // Get asset token reserve
      uint256 assetTokenReserve = assetToken.balanceOf(address(uniswapV3Pool));

      // Calculate asset swap amount
      uint256 assetSwapAmount = LiquidityMath.computeSwapAmountV2(
        assetTokenReserve,
        assetLiquidityAmount,
        poolFee
      );
      require(assetSwapAmount <= assetLiquidityAmount, "Bad liquidity math");

      // Approve swap
      assetToken.safeIncreaseAllowance(address(uniV3Swapper), assetSwapAmount);

      // Perform swap
      gameLiquidityAmount = uniV3Swapper.buyGameToken(
        assetSwapAmount,
        address(this)
      );

      // Update amount
      assetLiquidityAmount -= assetSwapAmount;
    } else if (assetLiquidityAmount == 0) {
      // Get game token reserve
      uint256 gameTokenReserve = gameToken.balanceOf(address(uniswapV3Pool));

      // Calculate game swap amount
      uint256 gameSwapAmount = LiquidityMath.computeSwapAmountV2(
        gameTokenReserve,
        gameLiquidityAmount,
        poolFee
      );
      require(gameSwapAmount <= gameLiquidityAmount, "Bad liquidity math");

      // Approve swap
      gameToken.safeIncreaseAllowance(address(uniV3Swapper), gameSwapAmount);

      // Perform swap
      assetLiquidityAmount = uniV3Swapper.sellGameToken(
        gameSwapAmount,
        address(this)
      );

      // Update amount
      gameLiquidityAmount -= gameSwapAmount;
    }

    // Validate state
    require(
      gameLiquidityAmount > 0 || assetLiquidityAmount > 0,
      "Invalid liquidity"
    );

    // Call external contracts
    if (gameLiquidityAmount > 0) {
      gameToken.safeIncreaseAllowance(
        address(uniswapV3NftManager),
        gameLiquidityAmount
      );
    }
    if (assetLiquidityAmount > 0) {
      assetToken.safeIncreaseAllowance(
        address(uniswapV3NftManager),
        assetLiquidityAmount
      );
    }

    // Deposit liquidity
    // slither-disable-next-line unused-return
    uniswapV3NftManager.increaseLiquidity(
      INonfungiblePositionManager.IncreaseLiquidityParams({
        tokenId: nftTokenId,
        amount0Desired: address(gameToken) < address(assetToken)
          ? gameLiquidityAmount
          : assetLiquidityAmount,
        amount1Desired: address(gameToken) < address(assetToken)
          ? assetLiquidityAmount
          : gameLiquidityAmount,
        amount0Min: 0,
        amount1Min: 0,
        // slither-disable-next-line timestamp
        deadline: block.timestamp
      })
    );

    // Stake LP-NFT in the stake farm
    uniswapV3NftManager.safeTransferFrom(
      address(this),
      lpNftStakeFarm,
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

    // Record game token balance to track any recovered from the LP-SFT
    uint256 gameTokenBalance = gameToken.balanceOf(address(this));
    uint256 assetTokenBalance = assetToken.balanceOf(address(this));

    // Transfer the LP-SFT to the contract
    lpSft.safeTransferFrom(_msgSender(), address(this), tokenId, 1, "");

    // Transfer the LP-SFT to the LP-NFT stake farm
    lpSft.safeTransferFrom(address(this), lpNftStakeFarm, tokenId, 1, "");

    // Read state
    // slither-disable-next-line unused-return
    (, , , , , , , uint128 uniV3LiquidityAmount, , , , ) = uniswapV3NftManager
      .positions(tokenId);

    // Withdraw tokens from the pool
    // slither-disable-next-line unused-return
    uniswapV3NftManager.decreaseLiquidity(
      INonfungiblePositionManager.DecreaseLiquidityParams({
        tokenId: tokenId,
        liquidity: uniV3LiquidityAmount,
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
    uint256 newGameTokenBalance = gameToken.balanceOf(address(this));
    uint256 newAssetTokenBalance = assetToken.balanceOf(address(this));

    if (newGameTokenBalance > gameTokenBalance) {
      gameToken.safeTransfer(
        address(this),
        newGameTokenBalance - gameTokenBalance
      );
    }
    if (newAssetTokenBalance > assetTokenBalance) {
      assetToken.safeTransfer(
        address(this),
        newAssetTokenBalance - assetTokenBalance
      );
    }

    // TODO: Emit event
  }
}

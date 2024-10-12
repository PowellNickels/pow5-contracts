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

import {IReverseRepo} from "../interfaces/bureaucracy/IReverseRepo.sol";
import {IUniV3StakeFarm} from "../interfaces/defi/IUniV3StakeFarm.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";
import {IGameTokenPooler} from "../interfaces/token/routes/IGameTokenPooler.sol";
import {IGameTokenSwapper} from "../interfaces/token/routes/IGameTokenSwapper.sol";
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
   * @dev The POW5 token
   */
  IERC20 public immutable pow5Token;

  /**
   * @dev The stable token
   */
  IERC20 public immutable stableToken;

  /**
   * @dev The upstream Uniswap V3 pool for the POW5/stable token pair
   */
  IUniswapV3Pool public immutable pow5StablePool;

  /**
   * @dev The token swapper
   */
  IGameTokenSwapper public immutable pow5StableSwapper;

  /**
   * @dev The token pooler
   */
  IGameTokenPooler public immutable pow5StablePooler;

  /**
   * @dev The POW5 LP-NFT stake farm
   */
  IUniV3StakeFarm public immutable pow5LpNftStakeFarm;

  /**
   * @dev The LP-SFT contract
   */
  ILPSFT public immutable lpSft;

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Yield Harvest contract
   *
   * @param owner_ The owner of the Dutch Auction
   * @param pow5Token_ The POW5 token
   * @param stableToken_ The stable token
   * @param pow5StablePool_ The upstream Uniswap V3 pool for the token pair
   * @param pow5StableSwapper_ The POW5 swapper
   * @param pow5StablePooler_ The POW5 pooler
   * @param pow5LpNftStakeFarm_ The POW5 LP-NFT stake farm
   * @param lpSft_ The LP-SFT token contract
   * @param uniswapV3NftManager_ The upstream Uniswap V3 NFT manager
   */
  constructor(
    address owner_,
    address pow5Token_,
    address stableToken_,
    address pow5StablePool_,
    address pow5StableSwapper_,
    address pow5StablePooler_,
    address pow5LpNftStakeFarm_,
    address lpSft_,
    address uniswapV3NftManager_
  ) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(pow5Token_ != address(0), "Invalid POW5");
    require(stableToken_ != address(0), "Invalid stable token");
    require(pow5StablePool_ != address(0), "Invalid pool");
    require(pow5StableSwapper_ != address(0), "Invalid swapper");
    require(pow5StablePooler_ != address(0), "Invalid pooler");
    require(pow5LpNftStakeFarm_ != address(0), "Invalid farm");
    require(lpSft_ != address(0), "Invalid LP-SFT");
    require(uniswapV3NftManager_ != address(0), "Invalid mgr");

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    pow5Token = IERC20(pow5Token_);
    stableToken = IERC20(stableToken_);
    pow5StablePool = IUniswapV3Pool(pow5StablePool_);
    pow5StableSwapper = IGameTokenSwapper(pow5StableSwapper_);
    pow5StablePooler = IGameTokenPooler(pow5StablePooler_);
    pow5LpNftStakeFarm = IUniV3StakeFarm(pow5LpNftStakeFarm_);
    lpSft = ILPSFT(lpSft_);
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);

    // Approve the stake farm to transfer our LP-NFTs
    uniswapV3NftManager.setApprovalForAll(pow5LpNftStakeFarm_, true);
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
    uint256 pow5Amount,
    uint256 stableTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 tokenId) {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate parameters
    require(pow5Amount > 0, "Invalid POW5 amount");
    require(stableTokenAmount > 0, "Invalid stable amount");
    require(receiver != address(0), "Invalid receiver");

    // Call external contracts
    pow5Token.safeTransferFrom(_msgSender(), address(this), pow5Amount);
    stableToken.safeTransferFrom(
      _msgSender(),
      address(this),
      stableTokenAmount
    );

    pow5Token.safeIncreaseAllowance(address(pow5StablePooler), pow5Amount);
    stableToken.safeIncreaseAllowance(
      address(pow5StablePooler),
      stableTokenAmount
    );

    // Approve the stake farm to transfer our LP-NFTs
    lpSft.setApprovalForAll(address(pow5LpNftStakeFarm), true);

    // Mint an LP-NFT
    tokenId = pow5StablePooler.mintLpNftImbalance(
      pow5Amount,
      stableTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    pow5LpNftStakeFarm.enter(tokenId);

    // Get newly-minted LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send POW5 dust to the receiver
    uint256 pow5Dust = pow5Token.balanceOf(address(this));
    if (pow5Dust > 0) {
      pow5Token.safeTransfer(receiver, pow5Dust);
    }

    // Send stable token dust to the receiver
    uint256 stableDust = stableToken.balanceOf(address(this));
    if (stableDust > 0) {
      stableToken.safeTransfer(receiver, stableDust);
    }

    // Return the LP-SFT to the receiver
    lpSft.safeTransferFrom(address(this), receiver, tokenId, 1, "");

    return tokenId;
  }

  /**
   * @dev See {IReverseRepo-purchase}
   */
  function purchase(
    uint256 pow5Amount,
    uint256 stableTokenAmount,
    address receiver
  ) external override nonReentrant returns (uint256 tokenId) {
    // Validate parameters
    require(pow5Amount > 0 || stableTokenAmount > 0, "Invalid amounts");
    require(receiver != address(0), "Invalid receiver");

    // Get the pool fee
    uint24 poolFee = pow5StablePool.fee();

    // Call external contracts
    if (pow5Amount > 0) {
      pow5Token.safeTransferFrom(_msgSender(), address(this), pow5Amount);
    }
    if (stableTokenAmount > 0) {
      stableToken.safeTransferFrom(
        _msgSender(),
        address(this),
        stableTokenAmount
      );
    }

    // Perform single-sided supply swap
    if (pow5Amount == 0) {
      // Get stable token reserve
      uint256 stableReserve = stableToken.balanceOf(address(pow5StablePool));

      // Calculate stable swap amount
      uint256 stableSwapAmount = LiquidityMath.computeSwapAmountV2(
        stableReserve,
        stableTokenAmount,
        poolFee
      );
      require(stableSwapAmount <= stableTokenAmount, "Bad liquidity math");

      // Approve swap
      stableToken.safeIncreaseAllowance(
        address(pow5StableSwapper),
        stableSwapAmount
      );

      // Perform swap
      pow5Amount = pow5StableSwapper.buyGameToken(
        stableSwapAmount,
        address(this)
      );

      // Update amount
      stableTokenAmount -= stableSwapAmount;
    } else if (stableTokenAmount == 0) {
      // Get POW5 reserve
      uint256 pow5Reserve = pow5Token.balanceOf(address(pow5StablePool));

      // Calculate POW5 swap amount
      uint256 pow5SwapAmount = LiquidityMath.computeSwapAmountV2(
        pow5Reserve,
        pow5Amount,
        poolFee
      );
      require(pow5SwapAmount <= pow5Amount, "Bad liquidity math");

      // Approve swap
      pow5Token.safeIncreaseAllowance(
        address(pow5StableSwapper),
        pow5SwapAmount
      );

      // Perform swap
      stableTokenAmount = pow5StableSwapper.sellGameToken(
        pow5SwapAmount,
        address(this)
      );

      // Update amount
      pow5Amount -= pow5SwapAmount;
    }

    // Validate state
    require(pow5Amount > 0 || stableTokenAmount > 0, "Invalid liquidity");

    // Approve tokens
    if (pow5Amount > 0) {
      pow5Token.safeIncreaseAllowance(address(pow5StablePooler), pow5Amount);
    }
    if (stableTokenAmount > 0) {
      stableToken.safeIncreaseAllowance(
        address(pow5StablePooler),
        stableTokenAmount
      );
    }

    // Mint an LP-NFT
    tokenId = pow5StablePooler.mintLpNftImbalance(
      pow5Amount,
      stableTokenAmount,
      address(this)
    );

    // Stake LP-NFT in the stake farm
    pow5LpNftStakeFarm.enter(tokenId);

    // Get newly-minted LP-SFT address
    address lpSftAddress = lpSft.tokenIdToAddress(tokenId);
    require(lpSftAddress != address(0), "Invalid LP-SFT");

    // Send POW5 dust to the receiver
    uint256 pow5Dust = pow5Token.balanceOf(address(this));
    if (pow5Dust > 0) {
      pow5Token.safeTransfer(receiver, pow5Dust);
    }

    // Send stable token dust to the receiver
    uint256 stableDust = stableToken.balanceOf(address(this));
    if (stableDust > 0) {
      stableToken.safeTransfer(receiver, stableDust);
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
    pow5LpNftStakeFarm.exit(tokenId);

    // Read state
    uint256 pow5Balance = pow5Token.balanceOf(address(this));

    // Swap any POW5 to the stable token
    if (pow5Balance > 0) {
      pow5Token.safeIncreaseAllowance(address(pow5StableSwapper), pow5Balance);
      // slither-disable-next-line unused-return
      pow5StableSwapper.sellGameToken(pow5Balance, address(this));
    }

    // Read state
    uint256 stableTokenBalance = stableToken.balanceOf(address(this));

    // Return any tokens to the sender
    if (stableTokenBalance > 0) {
      stableToken.safeTransfer(_msgSender(), stableTokenBalance);
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

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

pragma solidity 0.8.25;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IERC20Minimal} from "../../../interfaces/uniswap-v3-core/IERC20Minimal.sol";
import {IUniswapV3Pool} from "../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";
import {IUniswapV3Staker} from "../../../interfaces/uniswap-v3-staker/IUniswapV3Staker.sol";

import {IUniV3Staker} from "../../interfaces/token/routes/IUniV3Staker.sol";

import {LPSFT} from "../ERC1155/LPSFT.sol";

import {UniV3Pooler} from "./UniV3Pooler.sol";

/**
 * @dev Token router to stake a Uniswap V3 LP NFT in exchange for liquidity
 * rewards and market-making fees
 */
contract UniV3Staker is
  IUniV3Staker,
  Context,
  Ownable,
  ReentrancyGuard,
  ERC721Holder
{
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The Powell Nickels Uniswap V3 pooler
   */
  UniV3Pooler public immutable uniV3Pooler;

  /**
   * @dev The upstream Uniswap V3 NFT staker
   */
  IUniswapV3Staker public immutable uniswapV3Staker;

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  /**
   * @dev The upstream Uniswap V3 pool for the token pair
   */
  IUniswapV3Pool public immutable uniswapV3Pool;

  /**
   * @dev The Powell Nickels LP SFT contract
   */
  LPSFT public immutable lpSft;

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

  /**
   * @dev The reward token
   */
  IERC20 public immutable rewardToken;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev True if the incentive has been created, false otherwise
   */
  bool public incentiveCreated = false;

  /**
   * @dev The Uniswap V3 staker incentive key, calculated when the incentive is
   * created
   */
  IUniswapV3Staker.IncentiveKey public incentiveKey;

  /**
   * @dev The Uniswap V3 staker incentive ID, calculated when the incentive is
   * created
   */
  bytes32 public incentiveId;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param owner_ The initial owner of the contract
   * @param uniV3Pooler_ The address of our Uniswap V3 pooler contract
   * @param uniswapV3Staker_ The address of the Uniswap V3 staker contract
   * @param lpSft_ The address of the LP SFT contract
   * @param rewardToken_ The address of the reward token
   */
  constructor(
    address owner_,
    address uniV3Pooler_,
    address uniswapV3Staker_,
    address lpSft_,
    address rewardToken_
  ) Ownable(owner_) {
    // Validate parameters
    require(uniV3Pooler_ != address(0), "Invalid swapper");
    require(uniswapV3Staker_ != address(0), "Invalid staker");
    require(rewardToken_ != address(0), "Invalid reward");
    require(lpSft_ != address(0), "Invalid LP SFT");

    // Validate external contracts
    require(
      address(UniV3Pooler(uniV3Pooler_).uniswapV3Pool()) != address(0),
      "Invalid pooler pool"
    );
    require(
      address(UniV3Pooler(uniV3Pooler_).uniswapV3NftManager()) != address(0),
      "Invalid pooler mgr"
    );
    require(
      address(UniV3Pooler(uniV3Pooler_).gameToken()) != address(0),
      "Invalid pooler game"
    );
    require(
      address(UniV3Pooler(uniV3Pooler_).assetToken()) != address(0),
      "Invalid pooler asset"
    );

    // Initialize routes
    uniV3Pooler = UniV3Pooler(uniV3Pooler_);
    uniswapV3Staker = IUniswapV3Staker(uniswapV3Staker_);
    uniswapV3NftManager = UniV3Pooler(uniV3Pooler_).uniswapV3NftManager();
    uniswapV3Pool = UniV3Pooler(uniV3Pooler_).uniswapV3Pool();
    lpSft = LPSFT(lpSft_);
    gameIsToken0 = UniV3Pooler(uniV3Pooler_).gameIsToken0();
    gameToken = UniV3Pooler(uniV3Pooler_).gameToken();
    assetToken = UniV3Pooler(uniV3Pooler_).assetToken();
    rewardToken = IERC20(rewardToken_);
  }

  /**
   * @dev Initializes the staker incentive
   *
   * @param rewardAmount The reward to distribute in the incentive
   *
   * TODO: Allow creating multiple incentives?
   */
  function createIncentive(uint256 rewardAmount) public onlyOwner {
    // Validate state
    require(!incentiveCreated, "Incentive already created");

    // Update state
    incentiveCreated = true;
    incentiveKey = _createIncentiveKey();

    // See IncentiveId.sol in the Uniswap V3 staker dependency
    incentiveId = keccak256(abi.encode(incentiveKey));

    // Transfer the reward to this contract
    rewardToken.safeTransferFrom(_msgSender(), address(this), rewardAmount);

    // Approve the Uniswap V3 staker to spend the reward
    rewardToken.safeIncreaseAllowance(address(uniswapV3Staker), rewardAmount);

    // Create the incentive
    uniswapV3Staker.createIncentive(incentiveKey, rewardAmount);

    // Dispatch event
    // slither-disable-next-line reentrancy-events
    emit IncentiveCreated(
      _msgSender(),
      address(rewardToken),
      rewardAmount,
      incentiveKey.startTime,
      incentiveKey.endTime,
      incentiveKey.refundee
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IUniV3Staker}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IUniV3Staker-stakeNFTWithGameToken}
   */
  function stakeNFTWithGameToken(
    uint256 gameTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 nftTokenId) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive the game token from the caller
    _receiveTokens(gameTokenAmount, 0);

    // Mint the LP NFT
    nftTokenId = uniV3Pooler.mintNFTWithGameToken(
      gameTokenAmount,
      address(this)
    );

    // Return the LP SFT and the game token dust
    _returnSftAndDust(nftTokenId, recipient);

    // Dispatch event
    // slither-disable-next-line reentrancy-events
    emit NFTStaked(
      _msgSender(),
      recipient,
      address(uniswapV3NftManager),
      nftTokenId
    );

    return nftTokenId;
  }

  /**
   * @dev See {IUniV3Staker-stakeNFTWithAssetToken}
   */
  function stakeNFTWithAssetToken(
    uint256 assetTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 nftTokenId) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive the asset token from the caller
    _receiveTokens(0, assetTokenAmount);

    // Mint the LP NFT
    nftTokenId = uniV3Pooler.mintNFTWithAssetToken(
      assetTokenAmount,
      address(this)
    );

    // Return the LP SFT and the game token dust
    _returnSftAndDust(nftTokenId, recipient);

    // Dispatch event
    // slither-disable-next-line reentrancy-events
    emit NFTStaked(
      _msgSender(),
      recipient,
      address(uniswapV3NftManager),
      nftTokenId
    );

    return nftTokenId;
  }

  /**
   * @dev See {IUniV3Staker-stakeNFTImbalance}
   */
  function stakeNFTImbalance(
    uint256 gameTokenAmount,
    uint256 assetTokenAmount,
    address recipient
  ) public override nonReentrant returns (uint256 nftTokenId) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Receive tokens from the caller
    _receiveTokens(gameTokenAmount, assetTokenAmount);

    // Mint the LP NFT
    nftTokenId = uniV3Pooler.mintNFTImbalance(
      gameTokenAmount,
      assetTokenAmount,
      address(this)
    );

    // Return the LP SFT and the game token dust
    _returnSftAndDust(nftTokenId, recipient);

    // Dispatch event
    // slither-disable-next-line reentrancy-events
    emit NFTStaked(
      _msgSender(),
      recipient,
      address(uniswapV3NftManager),
      nftTokenId
    );

    return nftTokenId;
  }

  /**
   * @dev See {IUniV3Staker-unstakeNFT}
   */
  function unstakeNFT(
    uint256 nftTokenId,
    address recipient
  ) public override nonReentrant returns (uint256 assetTokenReturned) {
    // Validate parameters
    require(recipient != address(0), "Invalid recipient");

    // Validate ownership
    require(lpSft.balanceOf(_msgSender(), nftTokenId) == 1, "Must own voucher");

    // Burn the voucher for the LP NFT
    lpSft.burn(_msgSender(), nftTokenId);

    // Read state
    uint256 rewardBefore = uniswapV3Staker.rewards(
      incentiveKey.rewardToken,
      address(this)
    );

    // Unstake the LP NFT
    uniswapV3Staker.unstakeToken(incentiveKey, nftTokenId);

    // Read state
    uint256 rewardAfter = uniswapV3Staker.rewards(
      incentiveKey.rewardToken,
      address(this)
    );

    // Claim the reward
    uint256 rewardClaimed = uniswapV3Staker.claimReward(
      incentiveKey.rewardToken,
      address(this),
      rewardAfter - rewardBefore
    );

    // Withdraw the LP NFT to the pooler so that it can collect the liquidity
    uniswapV3Staker.withdrawToken(nftTokenId, address(uniV3Pooler), "");

    // Withdraw the liquidity. This returns the LP NFT to the staker.
    assetTokenReturned = uniV3Pooler.collectFromNFT(nftTokenId, address(this));

    // Transfer the empty LP NFT to the recipient as a keepsake
    uniswapV3NftManager.safeTransferFrom(address(this), recipient, nftTokenId);

    // Return the asset token to the recipient
    _returnAssetToken(recipient, assetTokenReturned);

    // Dispatch event
    // slither-disable-next-line reentrancy-events
    emit NFTUnstaked(
      _msgSender(),
      recipient,
      address(uniswapV3NftManager),
      nftTokenId,
      rewardClaimed,
      assetTokenReturned
    );

    return assetTokenReturned;
  }

  /**
   * @dev See {IUniV3Staker-exit}
   */
  function exit(
    uint256 nftTokenId
  ) public override returns (uint256 assetTokenReturned) {
    // Unstake and transfer the LP NFT
    assetTokenReturned = unstakeNFT(nftTokenId, _msgSender());

    return assetTokenReturned;
  }

  /**
   * @dev See {IUniV3Staker-getIncentive}
   */
  function getIncentive()
    public
    view
    override
    returns (
      uint256 totalRewardUnclaimed,
      uint160 totalSecondsClaimedX128,
      uint96 numberOfStakes
    )
  {
    // Validate state
    require(incentiveCreated, "Incentive not created");

    // Call external contract
    // slither-disable-next-line unused-return
    return uniswapV3Staker.incentives(incentiveId);
  }

  /**
   * @dev See {IUniV3Staker-getDeposit}
   */
  function getDeposit(
    uint256 tokenId
  )
    public
    view
    override
    returns (
      address owner_,
      uint48 numberOfStakes,
      int24 tickLower,
      int24 tickUpper
    )
  {
    // Call external contract
    (owner_, numberOfStakes, tickLower, tickUpper) = uniswapV3Staker.deposits(
      tokenId
    );

    // Validate result
    require(owner_ == address(this), "Invalid owner");

    // Translate result
    owner_ = lpSft.ownerOf(tokenId);

    return (owner_, numberOfStakes, tickLower, tickUpper);
  }

  /**
   * @dev See {IUniV3Staker-getStake}
   */
  function getStake(
    uint256 tokenId
  )
    public
    view
    override
    returns (uint160 secondsPerLiquidityInsideInitialX128, uint128 liquidity)
  {
    // Validate state
    require(incentiveCreated, "Incentive not created");

    // Call external contract
    // slither-disable-next-line unused-return
    return uniswapV3Staker.stakes(tokenId, incentiveId);
  }

  /**
   * @dev See {IUniV3Staker-getRewardsOwed}
   */
  function getRewardsOwed(
    address owner_
  ) public view override returns (uint256 rewardsOwed) {
    // Validate state
    require(incentiveCreated, "Incentive not created");

    // Call external contract
    return uniswapV3Staker.rewards(incentiveKey.rewardToken, owner_);
  }

  /**
   * @dev See {IUniV3Staker-getRewardInfo}
   */
  function getRewardInfo(
    uint256 tokenId
  ) public override returns (uint256 reward, uint160 secondsInsideX128) {
    // Validate state
    require(incentiveCreated, "Incentive not created");

    // Call external contract
    // slither-disable-next-line unused-return
    return uniswapV3Staker.getRewardInfo(incentiveKey, tokenId);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Private interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Transfer tokens to this contract and approve the UniV3 Pooler to
   * spend tokens
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
      gameToken.safeIncreaseAllowance(address(uniV3Pooler), gameTokenAmount);
    }
    if (assetTokenAmount > 0) {
      assetToken.safeTransferFrom(
        _msgSender(),
        address(this),
        assetTokenAmount
      );
      assetToken.safeIncreaseAllowance(address(uniV3Pooler), assetTokenAmount);
    }
  }

  /**
   * @dev Return the LP SFT, along with the dust, to the recipient
   *
   * @param nftTokenId The ID of the LP NFT
   * @param recipient The recipient of the LP SFT and dust
   */
  function _returnSftAndDust(uint256 nftTokenId, address recipient) private {
    // Mint the recipient a voucher for the LP NFT. This must be held by the
    // sender when unstaking the NFT.
    // slither-disable-next-line reentrancy-events
    lpSft.mint(recipient, nftTokenId, "");

    // Send the LP NFT to the Uniswap V3 staker contract and automatically
    // stake it
    uniswapV3NftManager.safeTransferFrom(
      address(this),
      address(uniswapV3Staker),
      nftTokenId,
      abi.encode(incentiveKey)
    );

    // Return dust to the recipient
    uint256 gameTokenDust = gameToken.balanceOf(address(this));
    if (gameTokenDust > 0) {
      gameToken.safeTransfer(recipient, gameTokenDust);
    }
  }

  /**
   * @dev Return the asset token to the recipient
   *
   * @param recipient The recipient of the asset token
   * @param assetTokenAmount The amount of the asset token to return
   */
  function _returnAssetToken(
    address recipient,
    uint256 assetTokenAmount
  ) private {
    // Call external contracts
    if (assetTokenAmount > 0)
      assetToken.safeTransfer(recipient, assetTokenAmount);
  }

  /**
   * @dev Returns the incentive key for the Uniswap V3 staker
   */
  function _createIncentiveKey()
    private
    view
    returns (IUniswapV3Staker.IncentiveKey memory)
  {
    return
      IUniswapV3Staker.IncentiveKey({
        rewardToken: IERC20Minimal(address(rewardToken)),
        pool: uniswapV3Pool,
        // slither-disable-next-line timestamp
        startTime: block.timestamp,
        // slither-disable-next-line timestamp
        endTime: block.timestamp + 1 weeks, // TODO
        refundee: address(this)
      });
  }
}

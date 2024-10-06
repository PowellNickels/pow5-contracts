/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import {IUniswapV3Pool} from "../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {IDutchAuctionRoutes} from "../../interfaces/bureaus/dutchAuction/IDutchAuctionRoutes.sol";
import {ILPNFTStakeFarm} from "../../interfaces/defi/ILPNFTStakeFarm.sol";
import {ILPSFT} from "../../interfaces/token/ERC1155/ILPSFT.sol";
import {IUniV3Pooler} from "../../interfaces/token/routes/IUniV3Pooler.sol";
import {IUniV3Swapper} from "../../interfaces/token/routes/IUniV3Swapper.sol";

/**
 * @title Bureau of the Dutch Auction
 */
contract DutchAuctionRoutes is IDutchAuctionRoutes {
  //////////////////////////////////////////////////////////////////////////////
  // Internal routes
  //////////////////////////////////////////////////////////////////////////////

  IERC20 internal immutable _gameToken;
  IERC20 internal immutable _assetToken;
  ILPSFT internal immutable _lpSft;
  IUniV3Swapper internal immutable _uniV3Swapper;
  IUniV3Pooler internal immutable _uniV3Pooler;
  ILPNFTStakeFarm internal immutable _lpNftStakeFarm;
  INonfungiblePositionManager internal immutable _uniswapV3NftManager;
  IUniswapV3Pool internal immutable _uniswapV3Pool;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Dutch Auction contract
   *
   * @param gameToken_ The native game token
   * @param assetToken_ The asset token
   * @param lpSft_ The LP-SFT contract
   * @param uniV3Swapper_ The UniV3 swapper
   * @param uniV3Pooler_ The UniV3 pooler
   * @param lpNftStakeFarm_ The LP-NFT stake farm
   * @param uniswapV3NftManager_ The upstream Uniswap V3 NFT manager
   * @param uniswapV3Pool_ The upstream Uniswap V3 pool
   */
  constructor(
    address gameToken_,
    address assetToken_,
    address lpSft_,
    address uniV3Swapper_,
    address uniV3Pooler_,
    address lpNftStakeFarm_,
    address uniswapV3NftManager_,
    address uniswapV3Pool_
  ) {
    // Validate parameters
    require(gameToken_ != address(0), "Invalid game token");
    require(assetToken_ != address(0), "Invalid asset token");
    require(lpSft_ != address(0), "Invalid LPSFT");
    require(uniV3Swapper_ != address(0), "Invalid swapper");
    require(uniV3Pooler_ != address(0), "Invalid pooler");
    require(lpNftStakeFarm_ != address(0), "Invalid farm");
    require(uniswapV3NftManager_ != address(0), "Invalid mgr");
    require(uniswapV3Pool_ != address(0), "Invalid pool");

    // Initialize routes
    _gameToken = IERC20(gameToken_);
    _assetToken = IERC20(assetToken_);
    _lpSft = ILPSFT(lpSft_);
    _uniV3Swapper = IUniV3Swapper(uniV3Swapper_);
    _uniV3Pooler = IUniV3Pooler(uniV3Pooler_);
    _lpNftStakeFarm = ILPNFTStakeFarm(lpNftStakeFarm_);
    _uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
    _uniswapV3Pool = IUniswapV3Pool(uniswapV3Pool_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IDutchAuctionRoutes}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override returns (bool) {
    return interfaceId == type(IDutchAuctionRoutes).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionRoutes}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuctionRoutes-gameToken}
   */
  function gameToken() external view override returns (IERC20) {
    return _gameToken;
  }

  /**
   * @dev See {IDutchAuctionRoutes-assetToken}
   */
  function assetToken() external view override returns (IERC20) {
    return _assetToken;
  }

  /**
   * @dev See {IDutchAuctionRoutes-lpSft}
   */
  function lpSft() external view override returns (ILPSFT) {
    return _lpSft;
  }

  /**
   * @dev See {IDutchAuctionRoutes-uniV3Swapper}
   */
  function uniV3Swapper() external view override returns (IUniV3Swapper) {
    return _uniV3Swapper;
  }

  /**
   * @dev See {IDutchAuctionRoutes-uniV3Pooler}
   */
  function uniV3Pooler() external view override returns (IUniV3Pooler) {
    return _uniV3Pooler;
  }

  /**
   * @dev See {IDutchAuctionRoutes-lpNftStakeFarm}
   */
  function lpNftStakeFarm() external view override returns (ILPNFTStakeFarm) {
    return _lpNftStakeFarm;
  }

  /**
   * @dev See {IDutchAuctionRoutes-uniswapV3NftManager}
   */
  function uniswapV3NftManager()
    external
    view
    override
    returns (INonfungiblePositionManager)
  {
    return _uniswapV3NftManager;
  }

  /**
   * @dev See {IDutchAuctionRoutes-uniswapV3Pool}
   */
  function uniswapV3Pool() external view override returns (IUniswapV3Pool) {
    return _uniswapV3Pool;
  }
}

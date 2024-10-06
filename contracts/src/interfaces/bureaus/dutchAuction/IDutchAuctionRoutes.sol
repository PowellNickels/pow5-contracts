/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IUniswapV3Pool} from "../../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {ILPNFTStakeFarm} from "../../../interfaces/defi/ILPNFTStakeFarm.sol";
import {ILPSFT} from "../../../interfaces/token/ERC1155/ILPSFT.sol";
import {IUniV3Pooler} from "../../../interfaces/token/routes/IUniV3Pooler.sol";
import {IUniV3Swapper} from "../../../interfaces/token/routes/IUniV3Swapper.sol";

/**
 * @title Bureau of the Dutch Auction, Routing Interface
 *
 * @dev These routes provide read-only access to the various contracts that the
 * Dutch Auction interacts with
 */
interface IDutchAuctionRoutes is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The native game token
   */
  function gameToken() external view returns (IERC20);

  /**
   * @dev The asset token, ideally a yielding asset
   */
  function assetToken() external view returns (IERC20);

  /**
   * @dev The LP-SFT contract
   */
  function lpSft() external view returns (ILPSFT);

  /**
   * @dev The UniV3 swapper for swapping between the game and asset tokens
   */
  function uniV3Swapper() external view returns (IUniV3Swapper);

  /**
   * @dev The UniV3 pooler for pooling the game and asset tokens
   */
  function uniV3Pooler() external view returns (IUniV3Pooler);

  /**
   * @dev The LP-NFT stake farm
   */
  function lpNftStakeFarm() external view returns (ILPNFTStakeFarm);

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  function uniswapV3NftManager()
    external
    view
    returns (INonfungiblePositionManager);

  /**
   * @dev The upstream Uniswap V3 pool
   */
  function uniswapV3Pool() external view returns (IUniswapV3Pool);
}

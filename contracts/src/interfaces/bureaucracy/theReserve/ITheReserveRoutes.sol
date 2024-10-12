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

import {IUniswapV3Factory} from "../../../../interfaces/uniswap-v3-core/IUniswapV3Factory.sol";
import {IUniswapV3Pool} from "../../../../interfaces/uniswap-v3-core/IUniswapV3Pool.sol";
import {INonfungiblePositionManager} from "../../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {ILPNFTStakeFarm} from "../../defi/ILPNFTStakeFarm.sol";
import {IUniV3StakeFarm} from "../../defi/IUniV3StakeFarm.sol";
import {ILPSFT} from "../../token/ERC1155/ILPSFT.sol";
import {IDexTokenSwapper} from "../../token/routes/IDexTokenSwapper.sol";
import {IGameTokenPooler} from "../../token/routes/IGameTokenPooler.sol";
import {IGameTokenSwapper} from "../../token/routes/IGameTokenSwapper.sol";

/**
 * @title The Reserve Smart Contract, Routing Interface
 *
 * @dev These routes provide access to the contracts that The Reserve's various
 * bureaus interact with
 */
interface ITheReserveRoutes is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Types
  //////////////////////////////////////////////////////////////////////////////

  struct TheReserveRoutes {
    IERC20 pow1Token;
    IERC20 pow5Token;
    IERC20 lpPow1Token;
    IERC20 lpPow5Token;
    IERC20 noPow5Token;
    IERC20 marketToken;
    IERC20 stableToken;
    IUniswapV3Pool pow1MarketPool;
    IGameTokenSwapper pow1MarketSwapper;
    IGameTokenPooler pow1MarketPooler;
    ILPNFTStakeFarm pow1LpNftStakeFarm;
    IUniswapV3Pool pow5StablePool;
    IGameTokenSwapper pow5StableSwapper;
    IGameTokenPooler pow5StablePooler;
    IUniV3StakeFarm pow5LpNftStakeFarm;
    IUniswapV3Pool marketStablePool;
    IDexTokenSwapper marketStableSwapper;
    ILPSFT lpSft;
    ILPSFTIssuable noLpSft;
    IUniswapV3Factory uniswapV3Factory;
    INonfungiblePositionManager uniswapV3NftManager;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1 game token
   */
  function pow1Token() external view returns (IERC20);

  /**
   * @dev The POW5 game token
   */
  function pow5Token() external view returns (IERC20);

  /**
   * @dev The LPPOW1 game token
   */
  function lpPow1Token() external view returns (IERC20);

  /**
   * @dev The LPPOW5 game token
   */
  function lpPow5Token() external view returns (IERC20);

  /**
   * @dev The NOPOW5 game token
   */
  function noPow5Token() external view returns (IERC20);

  /**
   * @dev The market token paired with POW1
   */
  function marketToken() external view returns (IERC20);

  /**
   * @dev The stable token paired with POW5
   */
  function stableToken() external view returns (IERC20);

  /**
   * @dev The POW1-market Uniswap V3 pool
   */
  function pow1MarketPool() external view returns (IUniswapV3Pool);

  /**
   * @dev The swapper for the POW1-market token pair
   */
  function pow1MarketSwapper() external view returns (IGameTokenSwapper);

  /**
   * @dev The pooler for the POW1-market token pair
   */
  function pow1MarketPooler() external view returns (IGameTokenPooler);

  /**
   * @dev The POW1 LP-NFT stake farm
   */
  function pow1LpNftStakeFarm() external view returns (ILPNFTStakeFarm);

  /**
   * @dev The POW5-stable Uniswap V3 pool
   */
  function pow5StablePool() external view returns (IUniswapV3Pool);

  /**
   * @dev The swapper for the POW5-stable token pair
   */
  function pow5StableSwapper() external view returns (IGameTokenSwapper);

  /**
   * @dev The pooler for the POW5-stable token pair
   */
  function pow5StablePooler() external view returns (IGameTokenPooler);

  /**
   * @dev The POW5 LP-NFT stake farm
   */
  function pow5LpNftStakeFarm() external view returns (IUniV3StakeFarm);

  /**
   * @dev The market-stable Uniswap V3 pool
   */
  function marketStablePool() external view returns (IUniswapV3Pool);

  /**
   * @dev The swapper for the market-stable token pair
   */
  function marketStableSwapper() external view returns (IDexTokenSwapper);

  /**
   * @dev The LPSFT contract
   */
  function lpSft() external view returns (ILPSFT);

  /**
   * @dev The NOLPSFT contract
   */
  function noLpSft() external view returns (IERC1155Enumerable);

  /**
   * @dev The upstream Uniswap V3 factory
   */
  function uniswapV3Factory() external view returns (IUniswapV3Factory);

  /**
   * @dev The upstream Uniswap V3 NFT manager
   */
  function uniswapV3NftManager()
    external
    view
    returns (INonfungiblePositionManager);
}

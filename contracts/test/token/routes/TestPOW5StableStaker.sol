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

pragma solidity 0.8.28;

import {TestGameTokenStaker} from "./TestGameTokenStaker.sol";

/**
 * @dev Token router send to liquidity to the POW5 pool in exchange for an
 * LP-SFT
 */
contract TestPOW5StableStaker is TestGameTokenStaker {
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the contract
   *
   * @param owner_ The initial owner of the contract
   * @param pow5Token_ The address of the POW5 token
   * @param stableToken_ The address of the stable token
   * @param rewardToken_ The address of the reward token
   * @param pow5StablePool_ The address of the pool for the token pair
   * @param pow5StablePooler_ The address of the pooler for the token pair
   * @param uniswapV3NftManager_ The address of the upstream Uniswap V3 NFT
   *        manager
   * @param uniswapV3Staker_ The address of the upstream Uniswap V3 staker
   * @param lpSft_ The address of the LP-SFT contract
   */
  constructor(
    address owner_,
    address pow5Token_,
    address stableToken_,
    address rewardToken_,
    address pow5StablePool_,
    address pow5StablePooler_,
    address uniswapV3NftManager_,
    address uniswapV3Staker_,
    address lpSft_
  )
    TestGameTokenStaker(
      owner_,
      pow5Token_,
      stableToken_,
      rewardToken_,
      pow5StablePool_,
      pow5StablePooler_,
      uniswapV3NftManager_,
      uniswapV3Staker_,
      lpSft_
    )
  {}
}

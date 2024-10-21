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

import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev DeFi manager interface
 */
interface IDeFiManager is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Public accessors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1 balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The POW1 balance
   */
  function pow1Balance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The POW1 balances of multiple LP-SFTs
   *
   * @param tokenIds The token IDs of the LP-SFTs
   *
   * @return The POW1 balances for all LP-SFTs
   */
  function pow1BalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  /**
   * @dev The POW5 balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The POW5 balance
   */
  function pow5Balance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The POW5 balances of multiple LP-SFTs
   *
   * @param tokenIds The token IDs of the LP-SFTs
   *
   * @return The POW5 balances for all LP-SFTs
   */
  function pow5BalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  /**
   * @dev The LPPOW1 balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The LPPOW1 balance
   */
  function lpPow1Balance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The LPPOW1 balances of multiple LP-SFTs
   *
   * @param tokenIds The tokens ID of the LP-SFTs
   *
   * @return The LPPOW1 balances for all LP-SFTs
   */
  function lpPow1BalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  /**
   * @dev The LPPOW5 balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The LPPOW5 balance
   */
  function lpPow5Balance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The LPPOW5 balances of multiple LP-SFTs
   *
   * @param tokenIds The token IDs of the LP-SFTs
   *
   * @return The LPPOW5 balances for all LP-SFTs
   */
  function lpPow5BalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  /**
   * @dev The NOPOW5 balance of the LP-SFT
   *
   * @param tokenId The token ID of the LP-SFT
   *
   * @return The NOPOW5 balance
   */
  function noPow5Balance(uint256 tokenId) external view returns (uint256);

  /**
   * @dev The NOPOW5 balances of multiple LP-SFTs
   *
   * @param tokenIds The token IDs of the LP-SFTs
   *
   * @return The NOPOW5 balances for all LP-SFTs
   */
  function noPow5BalanceBatch(
    uint256[] memory tokenIds
  ) external view returns (uint256[] memory);

  //////////////////////////////////////////////////////////////////////////////
  // Liquidity Forge functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Issue a POW5 loan using the LP-NFT as collateral
   */
  function issuePow5(
    uint256 tokenId,
    uint256 amount,
    address recipient
  ) external;

  /**
   * @dev Repay a POW5 loan
   */
  function repayPow5(uint256 tokenId, uint256 amount) external;
}

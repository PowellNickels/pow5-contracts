/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @dev LP-NFT interface
 */
interface ILPNFT is IERC165 {
  //////////////////////////////////////////////////////////////////////////////
  // Types
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Enum for which pool the LP-NFT belongs to, either LPPOW1 or LPPOW5
   */
  enum Pool {
    INVALID,
    LPPOW1,
    LPPOW5
  }

  //////////////////////////////////////////////////////////////////////////////
  // Errors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Error raised if a token ID is 0
   *
   * Uniswap V3 LP-NFTs start with ID 1, so a token ID of 0 is used to indicate
   * an invalid ID.
   */
  error LPNFTInvalidTokenID();

  /**
   * @dev Error raised if an initialized LP-NFT is reinitialized
   *
   * @param tokenId The token ID of the LP-NFT
   * @param pool The pool of the LP-NFT
   */
  error LPNFTReinitializationNotAllowed(uint256 tokenId, Pool pool);

  /**
   * @dev Error raised if the LP-NFT is for neither LPPOW1 nor LPPOW5 pools
   *
   * @param tokenId The token ID of the LP-NFT
   */
  error LPNFTInvalidPool(uint256 tokenId);

  //////////////////////////////////////////////////////////////////////////////
  // Lifecycle interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialize the LP-NFT
   *
   * @param lpNftTokenId The token ID of the LP-NFT
   */
  function initialize(uint256 lpNftTokenId) external;

  /**
   * @dev Deinitialize the LP-NFT
   *
   * Returns any leftover ETH or ERC-20 tokens to the beneficiary.
   *
   * @param beneficiary The beneficiary of leftover ETH or ERC-20 tokens, if any
   */
  function deinitialize(address beneficiary) external;

  //////////////////////////////////////////////////////////////////////////////
  // Public interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Get the LP-NFT's token ID
   *
   * @return The LP-NFT's token ID
   */
  function tokenId() external view returns (uint256);

  /**
   * @dev Get the LP-NFT's URI
   *
   * @return The LP-NFT's URI
   */
  function uri() external view returns (string memory);

  //////////////////////////////////////////////////////////////////////////////
  // DeFi interface
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Get the pool of the LP-NFT, either LPPOW1 or LPPOW5
   *
   * @return The pool of the LP-NFT, or UNKNOWN if the LP-NFT is invalid
   */
  function pool() external view returns (Pool);

  /**
   * @dev Get the POW1 balance of the LP-NFT
   *
   * @return The POW1 balance
   */
  function pow1Balance() external view returns (uint256);

  /**
   * @dev Get the POW5 balance of the LP-NFT
   *
   * @return The POW5 balance
   */
  function pow5Balance() external view returns (uint256);

  /**
   * @dev Get the LPPOW1 balance of the LP-NFT
   *
   * @return The LPPOW1 balance
   */
  function lpPow1Balance() external view returns (uint256);

  /**
   * @dev Get the LPPOW5 balance of the LP-NFT
   *
   * @return The LPPOW5 balance
   */
  function lpPow5Balance() external view returns (uint256);

  /**
   * @dev Get the mount of POW5 debt held by the LP-NFT
   *
   * @return The NOPOW5 balance
   */
  function noPow5Balance() external view returns (uint256);
}

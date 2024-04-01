/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.25;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title LP-NFT holder for SFT contract
 */
interface ILPNFTHolder is IERC165 {
  /**
   * @dev Get the token ID of a given address
   *
   * @param tokenAddress The address to convert to a token ID
   *
   * @return The token ID on success, or uint256(0) if `tokenAddress` does not
   * belong to a token ID
   */
  function addressToTokenId(
    address tokenAddress
  ) external view returns (uint256);

  /**
   * @dev Get the address for a given token ID
   *
   * @param tokenId The token ID to convert to an address
   *
   * @return The address, or address(0) in case `tokenId` does not belong to
   * an LP-NFT
   */
  function tokenIdToAddress(uint256 tokenId) external view returns (address);
}

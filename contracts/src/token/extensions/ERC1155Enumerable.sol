/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * This file is derived from the OpenZeppelin project under the MIT license.
 * Copyright (c) 2016-2024 Zeppelin Group Ltd and contributors
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0 AND MIT
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.25;

import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IERC1155Enumerable} from "../../interfaces/token/extensions/IERC1155Enumerable.sol";

/**
 * @title ERC-1155: Multi Token Standard, enumerable extension implementation
 */
abstract contract ERC1155Enumerable is ERC1155, IERC1155Enumerable {
  using Arrays for uint256[];
  using EnumerableSet for EnumerableSet.UintSet;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Total number of tokens in existence
   */
  uint256 private _totalSupply;

  /**
   * @dev Mapping from token ID to owner
   */
  mapping(uint256 => address) private _tokenOwner;

  /**
   * @dev Mapping from owner to owned token IDs
   */
  mapping(address => EnumerableSet.UintSet) private _ownedTokens;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ERC1155}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}.
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, ERC1155) returns (bool) {
    return
      interfaceId == type(IERC1155Enumerable).interfaceId ||
      super.supportsInterface(interfaceId);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ERC1155}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ERC1155-_update}
   */
  function _update(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values
  ) internal override {
    // Validate parameters
    if (ids.length != values.length) {
      revert IERC1155Errors.ERC1155InvalidArrayLength(
        ids.length,
        values.length
      );
    }

    // Translate parameters
    uint256 tokenCount = ids.length;

    for (uint256 i = 0; i < tokenCount; i++) {
      // Translate parameters
      uint256 nftTokenId = ids.unsafeMemoryAccess(i);

      // Validate parameters
      require(values.unsafeMemoryAccess(i) == 1, "Invalid amount");

      // Handle minting
      if (from == address(0)) {
        // Validate state
        require(_tokenOwner[nftTokenId] == address(0), "Already minted");

        // Update state
        _totalSupply += 1;
        _tokenOwner[nftTokenId] = to;
        require(_ownedTokens[to].add(nftTokenId), "Already added");
      }

      // Handle transfer
      if (from != address(0) && to != address(0)) {
        // Validate state
        require(_tokenOwner[nftTokenId] == from, "Invalid owner");

        // Update state
        _tokenOwner[nftTokenId] = to;
        require(_ownedTokens[from].remove(nftTokenId), "Already removed");
        require(_ownedTokens[to].add(nftTokenId), "Already added");
      }

      // Handle burning
      if (to == address(0)) {
        // Validate state
        require(_totalSupply > 0, "No tokens");
        require(_tokenOwner[nftTokenId] == from, "Invalid owner");

        // Update state
        _totalSupply -= 1;
        _tokenOwner[nftTokenId] = address(0);
        require(_ownedTokens[from].remove(nftTokenId), "Already removed");
      }
    }

    // Call ancestor
    super._update(from, to, ids, values);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC1155Enumerable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC1155Enumerable-totalSupply}
   */
  function totalSupply() public view override returns (uint256) {
    return _totalSupply;
  }

  /**
   * @dev See {IERC1155Enumerable-ownerOf}
   */
  function ownerOf(
    uint256 tokenId
  ) public view override returns (address owner) {
    // Read state
    owner = _tokenOwner[tokenId];

    return owner;
  }

  /**
   * @dev See {IERC1155Enumerable-getTokenIds}
   */
  function getTokenIds(
    address account
  ) public view override returns (uint256[] memory tokenIds) {
    // Load state
    EnumerableSet.UintSet storage ownedTokens = _ownedTokens[account];

    // Read state
    tokenIds = ownedTokens.values();

    return tokenIds;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Utility functions
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Get an amounts array suitable for NFTs (where the total supply of
   * each token is 1)
   */
  function _getAmountArray(
    uint256 tokenCount
  ) internal pure returns (uint256[] memory) {
    uint256[] memory array = new uint256[](tokenCount);

    for (uint256 i = 0; i < tokenCount; i++) {
      array[i] = 1;
    }

    return array;
  }
}

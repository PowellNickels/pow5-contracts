/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.25;

import {IERC1155Errors} from "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import {IERC1155Enumerable} from "../../../interfaces/token/ERC1155/extensions/IERC1155Enumerable.sol";
import {ILPNFT} from "../../../interfaces/token/ERC1155/ILPNFT.sol";
import {ILPNFTHolder} from "../../../interfaces/token/ERC1155/extensions/ILPNFTHolder.sol";
import {ILPSFT} from "../../../interfaces/token/ERC1155/ILPSFT.sol";

import {ERC1155NonReentrant} from "./ERC1155NonReentrant.sol";

/**
 * @title LP-NFT holder for SFT contract
 */
abstract contract LPNFTHolder is ERC1155NonReentrant, ILPNFTHolder {
  using Arrays for uint256[];

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-NFT used for clones
   */
  ILPNFT public immutable lpNftTemplate;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mapping tokenId -> LP-NFT
   */
  mapping(uint256 tokenId => ILPNFT token) internal _tokenIdToToken;

  /**
   * @dev Mapping LP-NFT -> tokenId
   */
  mapping(ILPNFT token => uint256 tokenId) internal _tokenToTokenId;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the ERC-1155 contract
   *
   * @param lpNftTemplate_ The LP-NFT contract used for clones
   */
  constructor(address lpNftTemplate_) {
    // Validate parameters
    require(lpNftTemplate_ != address(0), "Invalid LP-NFT");

    // Initialize routes
    lpNftTemplate = ILPNFT(lpNftTemplate_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ERC1155NonReentrant} and {ILPNFTHolder}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(ERC1155, IERC165) returns (bool) {
    return
      ERC1155.supportsInterface(interfaceId) ||
      interfaceId == type(ILPNFTHolder).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ERC1155} via {ERC1155NonReentrant}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ERC1155-_update}
   */
  function _update(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values
  ) internal virtual override nonReentrant(type(LPNFTHolder).interfaceId) {
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
      uint256 tokenId = ids.unsafeMemoryAccess(i);
      uint256 value = values.unsafeMemoryAccess(i);

      // Validate parameters
      if (value != 1) {
        revert IERC1155Enumerable.ERC1155EnumerableInvalidAmount(
          tokenId,
          value
        );
      }

      // Handle minting
      if (from == address(0)) {
        // Read state
        ILPNFT existingToken = _tokenIdToToken[tokenId];

        // Validate state
        if (address(existingToken) != address(0)) {
          revert ILPSFT.LPSFTInvalidToken(tokenId);
        }

        // Deploy clone
        ILPNFT token = ILPNFT(Clones.clone(address(lpNftTemplate)));

        // Update state
        _tokenIdToToken[tokenId] = token;
        _tokenToTokenId[token] = tokenId;

        // Initialize clone
        // slither-disable-next-line reentrancy-benign,reentrancy-no-eth
        token.initialize(tokenId);
      }

      // Handle burning
      if (to == address(0)) {
        // Read state
        ILPNFT token = _tokenIdToToken[tokenId];

        // Validate state
        if (address(token) == address(0)) {
          revert ILPSFT.LPSFTInvalidToken(tokenId);
        }

        // Update state
        delete _tokenIdToToken[tokenId];
        delete _tokenToTokenId[token];

        // Deinitialize clone
        token.deinitialize(address(this));
      }
    }

    // Call ancestor
    super._update(from, to, ids, values);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ILPNFTHolder}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ILPNFTHolder-addressToTokenId}
   */
  function addressToTokenId(
    address tokenAddress
  ) public view override returns (uint256) {
    // Validate parameters
    if (tokenAddress == address(0)) {
      revert ILPSFT.LPSFTInvalidToken(0);
    }

    return _tokenToTokenId[ILPNFT(tokenAddress)];
  }

  /**
   * @dev See {ILPNFTHolder-tokenIdToAddress}
   */
  function tokenIdToAddress(
    uint256 tokenId
  ) public view override returns (address) {
    if (tokenId == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }

    return address(_tokenIdToToken[tokenId]);
  }
}

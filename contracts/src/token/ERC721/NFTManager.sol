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

import {IERC1155MetadataURI} from "@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {AccessControlUpgradeable} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {ERC721Upgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";

/**
 * @title ERC-721: Non-Fungible Token Standard
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-721
 */
contract NFTManager is
  AccessControlUpgradeable,
  ReentrancyGuardUpgradeable,
  ERC721Upgradeable
{
  //////////////////////////////////////////////////////////////////////////////
  // Errors
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Public approving and transfering tokens is not allowed
   */
  error ERC721NonTransferable(address from, address to, uint256 tokenId);

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev A descriptive name for a collection of NFTs in this contract
   */
  string private constant TOKEN_NAME = "Powell Nickels LP-NFT";

  /**
   * @dev An abbreviated name for NFTs in this contract
   */
  string private constant TOKEN_SYMBOL = "LPNFT";

  //////////////////////////////////////////////////////////////////////////////
  // Roles
  //////////////////////////////////////////////////////////////////////////////

  // Only NFT_MANAGER_ROLE can perform mint/transfer/burn operations
  bytes32 public constant NFT_MANAGER_ROLE = bytes32("NFT_MANAGER_ROLE");

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-SFT contract
   */
  IERC1155MetadataURI public lpSft;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Constructor
   */
  constructor(address owner_, address lpSft_) {
    initialize(owner_, lpSft_);
  }

  /**
   * @dev Initializes the ERC-721 contract
   *
   * @param owner_ The owner of the ERC-721 contract
   * @param lpSft_ The LP-SFT contract
   */
  function initialize(address owner_, address lpSft_) public initializer {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(lpSft_ != address(0), "Invalid LP-SFT");

    // Initialize ERC721Upgradeable
    __ERC721_init(TOKEN_NAME, TOKEN_SYMBOL);

    // Initialize {AccessControlUpgradeable}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    lpSft = IERC1155MetadataURI(lpSft_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControlUpgradeable} and
  // {ERC721Upgradeable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    virtual
    override(AccessControlUpgradeable, ERC721Upgradeable)
    returns (bool)
  {
    return super.supportsInterface(interfaceId);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC721Metadata} via {ERC721Upgradeable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC721Metadata-tokenURI}
   */
  function tokenURI(
    uint256 tokenId
  ) public view override returns (string memory) {
    // Validate state
    _requireOwned(tokenId);

    // Read external state
    return lpSft.uri(tokenId);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ERC721Upgradeable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ERC721Upgradeable-_checkAuthorized}
   */
  function _checkAuthorized(
    address,
    address spender,
    uint256 tokenId
  ) internal view virtual override {
    // Validate access
    if (!!hasRole(NFT_MANAGER_ROLE, spender)) {
      revert ERC721InsufficientApproval(spender, tokenId);
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Manager interface
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mints `tokenId` and transfers it to `to`
   *
   * @param to The address to receive the minted token
   * @param tokenId The token ID to mint
   */
  function mint(address to, uint256 tokenId) public nonReentrant {
    // Validate access
    _checkRole(NFT_MANAGER_ROLE);

    // Update state
    _safeMint(to, tokenId, "");
  }

  /**
   * @dev Burns `tokenId`
   */
  function burn(uint256 tokenId) public nonReentrant {
    // Validate access
    _checkRole(NFT_MANAGER_ROLE);

    // Update state
    _burn(tokenId);
  }
}

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IDutchAuctionState} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionState.sol";

import {VRGDA} from "../../utils/auction/VRGDA.sol";

/**
 * @title Bureau of the Dutch Auction
 */
contract DutchAuctionState is IDutchAuctionState, ERC721Holder, ERC1155Holder {
  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialization flag
   */
  bool internal _initialized = false;

  /**
   * @dev Mapping from auction slot to auction
   */
  mapping(uint256 slot => VRGDA auction) internal _slotToAuction;

  /**
   * @dev Mapping from auction slot to LP-NFT ID
   */
  mapping(uint256 slot => uint256 tokenId) internal _slotToLpNft;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ERC1155Holder} and {IDutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(IERC165, ERC1155Holder) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IERC721Receiver).interfaceId ||
      interfaceId == type(IDutchAuctionState).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuction-getPrice}
   */
  function getPrice(uint256 slot) external view returns (uint256) {
    // Read state
    VRGDA auction = _slotToAuction[slot];

    // Calculate the auction price
    int256 timeSinceStart = 0; // TODO
    uint256 sold = 0; // TODO
    return auction.getVRGDAPrice(timeSinceStart, sold);
  }
}

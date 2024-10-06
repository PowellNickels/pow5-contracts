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
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {IDutchAuctionState} from "../../interfaces/bureaus/dutchAuction/IDutchAuctionState.sol";

/**
 * @title Bureau of the Dutch Auction
 */
contract DutchAuctionState is ERC721Holder, ERC1155Holder, IDutchAuctionState {
  using EnumerableSet for EnumerableSet.UintSet;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Mapping from LP-NFT token ID to its auction information
   */
  mapping(uint256 lpNftTtokenId => AuctionSlot auctionSlot) internal _auctions;

  /**
   * @dev Enumerable set of active LP-NFT token IDs
   */
  EnumerableSet.UintSet internal _activeAuctions;

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {ERC1155Holder} and {IDutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(ERC1155Holder, IERC165) returns (bool) {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IERC721Receiver).interfaceId ||
      interfaceId == type(IDutchAuctionState).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IDutchAuctionState}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IDutchAuctionState-getAuctions}
   */
  function getAuctions()
    external
    view
    override
    returns (AuctionSlot[] memory auctionSlots)
  {
    // Read state
    uint256 auctionCount = _activeAuctions.length();

    // Allocate return value
    auctionSlots = new AuctionSlot[](auctionCount);

    // Iterate state
    for (uint256 i = 0; i < auctionCount; i++) {
      // Read state
      uint256 lpNftTokenId = _activeAuctions.at(i);

      // Set return value
      auctionSlots[i] = getAuction(lpNftTokenId);
    }

    return auctionSlots;
  }

  /**
   * @dev See {IDutchAuctionState-getAuction}
   */
  function getAuction(
    uint256 lpNftTokenId
  ) public view override returns (AuctionSlot memory auctionSlot) {
    // Read state
    AuctionSlot storage slot = _auctions[lpNftTokenId];

    // Copy VRGDAParams from storage to memory
    VRGDAParams memory vrgdaParams = VRGDAParams({
      targetPrice: slot.vrgdaParams.targetPrice,
      priceDecayPercent: slot.vrgdaParams.priceDecayPercent,
      logisticLimit: slot.vrgdaParams.logisticLimit,
      timeScale: slot.vrgdaParams.timeScale,
      soldBySwitch: slot.vrgdaParams.soldBySwitch,
      switchTime: slot.vrgdaParams.switchTime,
      perTimeUnit: slot.vrgdaParams.perTimeUnit
    });

    // Create a memory copy of the AuctionSlot
    auctionSlot = AuctionSlot({
      lpNftTokenId: slot.lpNftTokenId,
      auctionStartTime: slot.auctionStartTime,
      sold: slot.sold,
      vrgdaParams: vrgdaParams
    });

    return auctionSlot;
  }
}

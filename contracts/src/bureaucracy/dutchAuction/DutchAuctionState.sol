/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.28;

import {ERC1155Holder} from "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ERC721Holder} from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {wadMul, wadExp} from "solmate/src/utils/SignedWadMath.sol";

import {IDutchAuctionState} from "../../interfaces/bureaucracy/dutchAuction/IDutchAuctionState.sol";

import {VRGDA} from "../../utils/auction/VRGDA.sol";

/**
 * @title Bureau of the Dutch Auction
 */
contract DutchAuctionState is IDutchAuctionState, ERC721Holder, ERC1155Holder {
  using EnumerableSet for EnumerableSet.UintSet;

  //////////////////////////////////////////////////////////////////////////////
  // Constants
  //////////////////////////////////////////////////////////////////////////////

  uint256 internal constant INITIAL_PRICE_BIPS = 2e14; // 0.02%
  uint256 internal constant MIN_PRICE_BIPS = 1e14; // 0.01%
  uint256 internal constant MAX_PRICE_BIPS = 1e18; // 100%
  uint256 internal constant GROWTH_RATE = 8e16; // 8% growth per sale
  uint256 internal constant DECAY_CONSTANT = 1e18; // TODO

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initialization flag
   */
  bool internal _initialized = false;

  /**
   * @dev Target number of LP-NFTs for sale
   */
  uint256 internal _targetLpNftCount;

  uint256 internal _nftCounter = 1; // Starts from 1

  // Auction metadata
  AuctionMetadata internal _auctionMetadata;

  // Auction settings
  AuctionSettings internal _auctionSettings;

  // Set of current LP-NFT token IDs on auction
  EnumerableSet.UintSet internal _currentAuctions;

  // Mapping from LP-NFT token ID to AuctionState
  mapping(uint256 => AuctionState) internal _auctionStates;

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
   * @dev See {IDutchAuctionState-getAuctionMetadata}
   */
  function getAuctionMetadata()
    external
    view
    override
    returns (AuctionMetadata memory)
  {
    return _auctionMetadata;
  }

  /**
   * @dev See {IDutchAuctionState-getAuctionSettings}
   */
  function getAuctionSettings()
    external
    view
    override
    returns (AuctionSettings memory)
  {
    return _auctionSettings;
  }

  /**
   * @dev See {IDutchAuctionState-getCurrentAuctionCount}
   */
  function getCurrentAuctionCount() external view override returns (uint256) {
    return _auctionMetadata.totalAuctions;
  }

  /**
   * @dev Returns the list of current LP-NFT token IDs on auction
   *
   * @return An array of LP-NFT token IDs
   */
  function getCurrentAuctions() external view returns (uint256[] memory) {
    uint256 length = _currentAuctions.length();
    uint256[] memory auctionIds = new uint256[](length);

    for (uint256 i = 0; i < length; i++) {
      auctionIds[i] = _currentAuctions.at(i);
    }

    return auctionIds;
  }

  /**
   * @dev Returns the auction states of the current auctions
   *
   * @return An array of AuctionState structs
   */
  function getCurrentAuctionStates()
    external
    view
    override
    returns (AuctionState[] memory)
  {
    uint256 length = _currentAuctions.length();
    AuctionState[] memory auctionStates = new AuctionState[](length);

    for (uint256 i = 0; i < length; i++) {
      uint256 lpNftTokenId = _currentAuctions.at(i);
      auctionStates[i] = _auctionStates[lpNftTokenId];
    }

    return auctionStates;
  }

  /**
   * @dev See {IDutchAuctionState-getAuctionState}
   */
  function getAuctionState(
    uint256 lpNftTokenId
  ) external view override returns (AuctionState memory) {
    return _auctionStates[lpNftTokenId];
  }

  /**
   * @dev See {IDutchAuctionState-getCurrentPrice}
   */
  function getCurrentPriceBips(
    uint256 lpNftTokenId
  ) public view override returns (uint256) {
    // Read state
    AuctionState memory auction = _auctionStates[lpNftTokenId];

    // Validate state
    require(auction.lpNftTokenId == lpNftTokenId, "LP-NFT not for sale");
    require(!auction.sold, "Auction already sold");
    require(auction.startTime > 0, "Auction not started");

    // Calculate time elapsed since auction start
    uint256 timeElapsed = block.timestamp - auction.startTime;

    // Calculate decay factor
    int256 decayFactor = int256(_auctionSettings.priceDecayRate) *
      int256(timeElapsed);

    // Calculate decayed price
    uint256 decayedPriceBips = uint256(
      wadMul(int256(auction.startPriceBips), wadExp(-decayFactor))
    );

    // Ensure price does not go below minPriceBips
    if (decayedPriceBips < _auctionSettings.minPriceBips) {
      decayedPriceBips = _auctionSettings.minPriceBips;
    }

    return decayedPriceBips;
  }
}

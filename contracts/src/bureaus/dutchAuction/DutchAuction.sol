/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IDutchAuction} from "../../interfaces/bureaus/dutchAuction/IDutchAuction.sol";

import {DutchAuctionRoutes} from "./DutchAuctionRoutes.sol";
import {DutchAuctionActions} from "./DutchAuctionActions.sol";
import {DutchAuctionAdminActions} from "./DutchAuctionAdminActions.sol";

/**
 * @title Bureau of the Dutch Auction
 */
contract DutchAuction is
  DutchAuctionAdminActions,
  DutchAuctionActions,
  IDutchAuction
{
  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Dutch Auction contract
   *
   * @param owner_ The owner of the Dutch Auction
   * @param gameToken_ The native game token
   * @param assetToken_ The yielding asset token
   * @param lpSft_ The LP-SFT contract
   * @param uniV3Pooler_ The UniV3 pooler
   * @param uniV3Swapper_ The UniV3 swapper
   * @param lpNftStakeFarm_ The LP-NFT stake farm
   * @param uniswapV3NftManager_ The upstream Uniswap V3 NFT manager
   * @param uniswapV3Pool_ The upstream Uniswap V3 pool
   */
  constructor(
    address owner_,
    address gameToken_,
    address assetToken_,
    address lpSft_,
    address uniV3Pooler_,
    address uniV3Swapper_,
    address lpNftStakeFarm_,
    address uniswapV3NftManager_,
    address uniswapV3Pool_
  )
    DutchAuctionAdminActions(owner_)
    DutchAuctionRoutes(
      gameToken_,
      assetToken_,
      lpSft_,
      uniV3Pooler_,
      uniV3Swapper_,
      lpNftStakeFarm_,
      uniswapV3NftManager_,
      uniswapV3Pool_
    )
  {}

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IDutchAuctionRoutes},
  // {IDutchAuctionState}, {IDutchAuctionAdminActions} and
  // {IDutchAuctionActions}
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
    override(DutchAuctionAdminActions, DutchAuctionActions, IERC165)
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(IDutchAuction).interfaceId;
  }
}

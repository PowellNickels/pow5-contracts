/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {IDutchAuctionActions} from "./IDutchAuctionActions.sol";
import {IDutchAuctionAdminActions} from "./IDutchAuctionAdminActions.sol";
import {IDutchAuctionErrors} from "./IDutchAuctionErrors.sol";
import {IDutchAuctionEvents} from "./IDutchAuctionEvents.sol";
import {IDutchAuctionRoutes} from "./IDutchAuctionRoutes.sol";
import {IDutchAuctionState} from "./IDutchAuctionState.sol";

/**
 * @title The interface for the Bureau of the Dutch Auction
 */
interface IDutchAuction is
  IERC165,
  IDutchAuctionEvents,
  IDutchAuctionErrors,
  IDutchAuctionRoutes,
  IDutchAuctionState,
  IDutchAuctionAdminActions,
  IDutchAuctionActions
{}

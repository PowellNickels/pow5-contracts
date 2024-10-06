/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

/**
 * @title Bureau of the Dutch Auction, Error Interface
 *
 * @dev This includes errors for both public actions and admin actions
 */
interface IDutchAuctionErrors {
  //////////////////////////////////////////////////////////////////////////////
  // Admin Errors
  //////////////////////////////////////////////////////////////////////////////

  error DutchAuctionNotInitialized();

  error DutchAuctionAlreadyInitialized();

  //////////////////////////////////////////////////////////////////////////////
  // Public Errors
  //////////////////////////////////////////////////////////////////////////////

  error AuctionNotEnabled(uint256 slot);
}

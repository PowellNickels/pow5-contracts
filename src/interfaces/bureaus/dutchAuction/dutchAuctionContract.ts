/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../baseContract";
import { DutchAuctionActionsMixin } from "./dutchAuctionActionsMixin";
import { DutchAuctionAdminActionsMixin } from "./dutchAuctionAdminActionsMixin";
import { DutchAuctionRoutesMixin } from "./dutchAuctionRoutesMixin";
import { DutchAuctionStateMixin } from "./dutchAuctionStateMixin";

const DutchAuctionActionsContract = DutchAuctionActionsMixin(BaseContract);
const DutchAuctionAdminActionsContract = DutchAuctionAdminActionsMixin(
  DutchAuctionActionsContract,
);
const DutchAuctionRoutesContract = DutchAuctionRoutesMixin(
  DutchAuctionAdminActionsContract,
);
const DutchAuctionStateContract = DutchAuctionStateMixin(
  DutchAuctionRoutesContract,
);

class DutchAuctionContract extends DutchAuctionStateContract {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { DutchAuctionContract };

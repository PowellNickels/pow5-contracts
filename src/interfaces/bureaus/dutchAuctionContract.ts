/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../baseContract";
import { DutchAuctionMixin } from "./dutchAuctionMixin";

const DutchAuctionContractBase = DutchAuctionMixin(BaseContract);

class DutchAuctionContract extends DutchAuctionContractBase {
  constructor(signer: ethers.Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { DutchAuctionContract };
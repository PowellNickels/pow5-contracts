/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../baseContract";
import { YieldHarvestMixin } from "./yieldHarvestMixin";

const YieldHarvestContractBase = YieldHarvestMixin(BaseContract);

class YieldHarvestContract extends YieldHarvestContractBase {
  constructor(signer: ethers.Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { YieldHarvestContract };

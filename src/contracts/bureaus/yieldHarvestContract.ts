/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { BaseContract } from "../baseContract";
import { YieldHarvestMixin } from "./yieldHarvestMixin";

const YieldHarvestContractBase = YieldHarvestMixin(BaseContract);

class YieldHarvestContract extends YieldHarvestContractBase {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { YieldHarvestContract };

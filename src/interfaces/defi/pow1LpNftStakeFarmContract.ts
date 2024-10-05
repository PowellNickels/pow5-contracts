/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../baseContract";
import { FarmMixin } from "./farmMixin";

const FarmContract = FarmMixin(BaseContract);

class POW1LpNftStakeFarmContract extends FarmContract {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: string,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { POW1LpNftStakeFarmContract };

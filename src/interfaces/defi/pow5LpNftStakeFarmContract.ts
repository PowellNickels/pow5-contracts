/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../baseContract";
import { AccessControlMixin } from "../zeppelin/access/accessControlMixin";
import { UniV3StakeFarmMixin } from "./uniV3StakeFarmMixin";

const AccessControlContract = AccessControlMixin(BaseContract);
const UniV3StakeFarmContract = UniV3StakeFarmMixin(AccessControlContract);

class POW5LpNftStakeFarmContract extends UniV3StakeFarmContract {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: string,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { POW5LpNftStakeFarmContract };

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
import { FarmMixin } from "./farmMixin";
import { LpSftLendFarmMixin } from "./lpSftLendFarmMixin";

const AccessControlContract = AccessControlMixin(BaseContract);
const FarmContract = FarmMixin(AccessControlContract);
const LpSftLendFarmContract = LpSftLendFarmMixin(FarmContract);

class POW5LpSftLendFarmContract extends LpSftLendFarmContract {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: string,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { POW5LpSftLendFarmContract };

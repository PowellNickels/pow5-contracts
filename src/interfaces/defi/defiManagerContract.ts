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
import { DeFiManagerMixin } from "./defiManagerMixin";

const AccessControlContract = AccessControlMixin(BaseContract);
const DeFiManagerContractBase = DeFiManagerMixin(AccessControlContract);

class DeFiManagerContract extends DeFiManagerContractBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: string,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { DeFiManagerContract };

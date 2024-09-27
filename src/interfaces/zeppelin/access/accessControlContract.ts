/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../baseContract";
import { AccessControlMixin } from "./accessControlMixin";

const AccessControlContractBase = AccessControlMixin(BaseContract);

class AccessControlContract extends AccessControlContractBase {
  constructor(signer: ethers.Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { AccessControlContract };

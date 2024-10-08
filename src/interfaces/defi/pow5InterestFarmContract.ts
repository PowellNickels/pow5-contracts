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
import { ERC20InterestFarmMixin } from "./erc20InterestFarmMixin";
import { FarmMixin } from "./farmMixin";

const AccessControlContract = AccessControlMixin(BaseContract);
const FarmContract = FarmMixin(AccessControlContract);
const ERC20InterestFarmContract = ERC20InterestFarmMixin(FarmContract);

class POW5InterestFarmContract extends ERC20InterestFarmContract {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { POW5InterestFarmContract };

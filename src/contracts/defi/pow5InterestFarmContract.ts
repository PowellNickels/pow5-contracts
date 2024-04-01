/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { AccessControlMixin } from "../zeppelin/access/accessControlMixin";
import { ERC20InterestFarmMixin } from "./erc20InterestFarmMixin";
import { FarmMixin } from "./farmMixin";

class Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  constructor(...args: any[]) {}
}

const AccessControlContract = AccessControlMixin(Base);
const FarmContract = FarmMixin(AccessControlContract);
const ERC20InterestFarmContract = ERC20InterestFarmMixin(FarmContract);

class POW5InterestFarmContract extends ERC20InterestFarmContract {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { POW5InterestFarmContract };

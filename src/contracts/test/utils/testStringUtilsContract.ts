/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { BaseContract } from "../../baseContract";
import { TestStringUtilsMixin } from "./testStringUtilsMixin";

const TestStringUtilsContractBase = TestStringUtilsMixin(BaseContract);

class TestStringUtilsContract extends TestStringUtilsContractBase {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { TestStringUtilsContract };

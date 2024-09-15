/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { TestStringUtilsMixin } from "./testStringUtilsMixin";

class Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  constructor(...args: any[]) {}
}

const TestStringUtilsContractBase = TestStringUtilsMixin(Base);

class TestStringUtilsContract extends TestStringUtilsContractBase {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { TestStringUtilsContract };

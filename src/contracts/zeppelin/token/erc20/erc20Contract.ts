/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { ERC20Mixin } from "./erc20Mixin";

class Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  constructor(...args: any[]) {}
}

const ERC20ContractBase = ERC20Mixin(Base);

class ERC20Contract extends ERC20ContractBase {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { ERC20Contract };

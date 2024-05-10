/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { LiquidityForgeMixin } from "./liquidityForgeMixin";

class Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  constructor(...args: any[]) {}
}

const LiquidityForgeContractBase = LiquidityForgeMixin(Base);

class LiquidityForgeContract extends LiquidityForgeContractBase {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { LiquidityForgeContract };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { ERC20Mixin } from "../../zeppelin/token/erc20/erc20Mixin";
import { WrappedNativeMixin } from "./wrappedNativeMixin";

class Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  constructor(...args: any[]) {}
}

const ERC20Contract = ERC20Mixin(Base);
const WrappedNativeContractBase = WrappedNativeMixin(ERC20Contract);

class WrappedNativeContract extends WrappedNativeContractBase {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { WrappedNativeContract };

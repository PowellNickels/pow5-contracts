/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { AccessControlMixin } from "../../zeppelin/access/accessControlMixin";
import { ERC20Mixin } from "../../zeppelin/token/erc20/erc20Mixin";
import { ERC20MetadataMixin } from "../../zeppelin/token/erc20/extensions/erc20MetadataMixin";
import { ERC20IssuableMixin } from "./extensions/erc20IssuableMixin";

class Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  constructor(...args: any[]) {}
}

const ERC20Contract = ERC20Mixin(Base);
const ERC20MetadataContract = ERC20MetadataMixin(ERC20Contract);
const AccessControlContract = AccessControlMixin(ERC20MetadataContract);
const ERC20IssuableContract = ERC20IssuableMixin(AccessControlContract);

class LPPOW5Contract extends ERC20IssuableContract {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { LPPOW5Contract };

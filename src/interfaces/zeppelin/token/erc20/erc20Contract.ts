/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../../baseContract";
import { ERC20Mixin } from "./erc20Mixin";

const ERC20ContractBase = ERC20Mixin(BaseContract);

class ERC20Contract extends ERC20ContractBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: string,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { ERC20Contract };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../baseContract";
import { UniV3SwapperMixin } from "./uniV3SwapperMixin";

const UniV3SwapperContractBase = UniV3SwapperMixin(BaseContract);

class UniV3SwapperContract extends UniV3SwapperContractBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { UniV3SwapperContract };

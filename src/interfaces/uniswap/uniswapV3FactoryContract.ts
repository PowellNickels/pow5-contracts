/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../baseContract";
import { UniswapV3FactoryMixin } from "./uniswapV3FactoryMixin";

const UniswapV3FactoryContractBase = UniswapV3FactoryMixin(BaseContract);

class UniswapV3FactoryContract extends UniswapV3FactoryContractBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { UniswapV3FactoryContract };

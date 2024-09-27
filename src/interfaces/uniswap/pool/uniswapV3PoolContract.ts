/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../baseContract";
import { UniswapV3PoolActionsMixin } from "./uniswapV3PoolActionsMixin";
import { UniswapV3PoolDerivedStateMixin } from "./uniswapV3PoolDerivedStateMixin";
import { UniswapV3PoolImmutablesMixin } from "./uniswapV3PoolImmutablesMixin";
import { UniswapV3PoolOwnerActionsMixin } from "./uniswapV3PoolOwnerActionsMixin";
import { UniswapV3PoolStateMixin } from "./uniswapV3PoolStateMixin";

const UniswapV3PoolImmutablesContract =
  UniswapV3PoolImmutablesMixin(BaseContract);
const UniswapV3PoolStateContract = UniswapV3PoolStateMixin(
  UniswapV3PoolImmutablesContract,
);
const UniswapV3PoolDerivedStateContract = UniswapV3PoolDerivedStateMixin(
  UniswapV3PoolStateContract,
);
const UniswapV3PoolActionsContract = UniswapV3PoolActionsMixin(
  UniswapV3PoolDerivedStateContract,
);
const UniswapV3PoolOwnerActionsContract = UniswapV3PoolOwnerActionsMixin(
  UniswapV3PoolActionsContract,
);

class UniswapV3PoolContract extends UniswapV3PoolOwnerActionsContract {
  constructor(signer: ethers.Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { UniswapV3PoolContract };

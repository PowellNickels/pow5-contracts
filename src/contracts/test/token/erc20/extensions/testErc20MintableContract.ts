/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../../../baseContract";
import { ERC20Mixin } from "../../../../zeppelin/token/erc20/erc20Mixin";
import { TestERC20MintableMixin } from "./testErc20MintableMixin";

const ERC20Contract = ERC20Mixin(BaseContract);
const TestERC20MintableContractBase = TestERC20MintableMixin(ERC20Contract);

class TestERC20MintableContract extends TestERC20MintableContractBase {
  constructor(signer: ethers.Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { TestERC20MintableContract };

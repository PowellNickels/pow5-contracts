/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { BaseContract } from "../../../../baseContract";
import { ERC1155EnumerableMixin } from "../../../../token/erc1155/extensions/erc1155EnumerableMixin";
import { ERC1155Mixin } from "../../../../zeppelin/token/erc1155/erc1155Mixin";
import { ERC1155MetadataURIMixin } from "../../../../zeppelin/token/erc1155/extensions/erc1155MetadataUriMixin";
import { TestERC1155EnumerableMixin } from "./testErc1155EnumerableMixin";

const ERC1155MetadataURIContract = ERC1155MetadataURIMixin(BaseContract);
const ERC1155Contract = ERC1155Mixin(ERC1155MetadataURIContract);
const ERC1155EnumerableContract = ERC1155EnumerableMixin(ERC1155Contract);
const TestERC1155EnumerableContractBase = TestERC1155EnumerableMixin(
  ERC1155EnumerableContract,
);

class TestERC1155EnumerableContract extends TestERC1155EnumerableContractBase {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { TestERC1155EnumerableContract };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { ERC1155Mixin } from "./erc1155Mixin";
import { ERC1155MetadataURIMixin } from "./extensions/erc1155MetadataUriMixin";

class Base {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  constructor(...args: any[]) {}
}

const ERC1155MetadataURIContract = ERC1155MetadataURIMixin(Base);
const ERC1155ContractBase = ERC1155Mixin(ERC1155MetadataURIContract);

class ERC1155Contract extends ERC1155ContractBase {
  constructor(signer: Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { ERC1155Contract };

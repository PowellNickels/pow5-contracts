/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../../baseContract";
import { ERC1155Mixin } from "./erc1155Mixin";
import { ERC1155MetadataURIMixin } from "./extensions/erc1155MetadataUriMixin";

const ERC1155MetadataURIContract = ERC1155MetadataURIMixin(BaseContract);
const ERC1155ContractBase = ERC1155Mixin(ERC1155MetadataURIContract);

class ERC1155Contract extends ERC1155ContractBase {
  constructor(
    contractRunner: ethers.Provider | ethers.Signer,
    contractAddress: `0x${string}`,
  ) {
    super(contractRunner, contractAddress);
  }
}

export { ERC1155Contract };

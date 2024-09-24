/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { BaseContract } from "../../baseContract";
import { AccessControlMixin } from "../../zeppelin/access/accessControlMixin";
import { ERC1155Mixin } from "../../zeppelin/token/erc1155/erc1155Mixin";
import { ERC1155MetadataURIMixin } from "../../zeppelin/token/erc1155/extensions/erc1155MetadataUriMixin";
import { ERC1155EnumerableMixin } from "./extensions/erc1155EnumerableMixin";
import { LPSFTIssuableMixin } from "./extensions/lpSftIssuableMixin";

const ERC1155Contract = ERC1155Mixin(BaseContract);
const ERC1155MetadataURIContract = ERC1155MetadataURIMixin(ERC1155Contract);
const ERC1155EnumerableContract = ERC1155EnumerableMixin(
  ERC1155MetadataURIContract,
);
const AccessControlContract = AccessControlMixin(ERC1155EnumerableContract);
const LPSFTIssuableContract = LPSFTIssuableMixin(AccessControlContract);

class NOLPSFTContract extends LPSFTIssuableContract {
  constructor(signer: ethers.Signer, contractAddress: string) {
    super(signer, contractAddress);
  }
}

export { NOLPSFTContract };

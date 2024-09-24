/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC1155MetadataURI } from "../../../../../types/@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI";
import { IERC1155MetadataURI__factory } from "../../../../../types/factories/@openzeppelin/contracts/token/ERC1155/extensions/IERC1155MetadataURI__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC1155MetadataURIMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends Base {
    private erc1155MetadataUri: IERC1155MetadataURI;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.erc1155MetadataUri = IERC1155MetadataURI__factory.connect(
        contractAddress,
        signer,
      );
    }

    async uri(id: bigint): Promise<string> {
      return await this.erc1155MetadataUri.uri(id);
    }
  };
}

export { ERC1155MetadataURIMixin };

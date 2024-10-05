/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC1155Enumerable } from "../../../../types/contracts/src/interfaces/token/ERC1155/extensions/IERC1155Enumerable";
import { IERC1155Enumerable__factory } from "../../../../types/factories/contracts/src/interfaces/token/ERC1155/extensions/IERC1155Enumerable__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC1155EnumerableMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc1155Enumerable: IERC1155Enumerable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        string,
      ];

      this.erc1155Enumerable = IERC1155Enumerable__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async totalSupply(): Promise<bigint> {
      return await this.erc1155Enumerable.totalSupply();
    }

    async ownerOf(tokenId: bigint): Promise<string> {
      return await this.erc1155Enumerable.ownerOf(tokenId);
    }

    async getTokenIds(account: string): Promise<bigint[]> {
      return await this.erc1155Enumerable.getTokenIds(account);
    }
  };
}

export { ERC1155EnumerableMixin };

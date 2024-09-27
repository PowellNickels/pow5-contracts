/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { ILPNFTHolder } from "../../../../types/contracts/src/interfaces/token/ERC1155/extensions/ILPNFTHolder";
import { ILPNFTHolder__factory } from "../../../../types/factories/contracts/src/interfaces/token/ERC1155/extensions/ILPNFTHolder__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function LPNFTHolderMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private lpNftTHolder: ILPNFTHolder;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.lpNftTHolder = ILPNFTHolder__factory.connect(
        contractAddress,
        signer,
      );
    }

    async addressToTokenId(tokenAddress: string): Promise<bigint> {
      return await this.lpNftTHolder.addressToTokenId(tokenAddress);
    }

    async addressesToTokenIds(tokenAddresses: string[]): Promise<bigint[]> {
      return await this.lpNftTHolder.addressesToTokenIds(tokenAddresses);
    }

    async tokenIdToAddress(tokenId: bigint): Promise<string> {
      return await this.lpNftTHolder.tokenIdToAddress(tokenId);
    }

    async tokenIdsToAddresses(tokenIds: bigint[]): Promise<string[]> {
      return await this.lpNftTHolder.tokenIdsToAddresses(tokenIds);
    }
  };
}

export { LPNFTHolderMixin };

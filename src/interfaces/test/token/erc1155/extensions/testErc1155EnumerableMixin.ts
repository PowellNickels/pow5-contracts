/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { TestERC1155Enumerable } from "../../../../../types/contracts/test/token/erc1155/extensions/TestERC1155Enumerable";
import { TestERC1155Enumerable__factory } from "../../../../../types/factories/contracts/test/token/erc1155/extensions/TestERC1155Enumerable__factory";
import { BaseMixin } from "../../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function TestERC1155EnumerableMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private testErc1155Enumerable: TestERC1155Enumerable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.testErc1155Enumerable = TestERC1155Enumerable__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async mintNFT(
      account: `0x${string}`,
      nftTokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.testErc1155Enumerable.mintNFT(account, nftTokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async batchMintNFT(
      account: `0x${string}`,
      nftTokenIds: bigint[],
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.testErc1155Enumerable.batchMintNFT(account, nftTokenIds);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async burnNFT(
      account: `0x${string}`,
      nftTokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.testErc1155Enumerable.burnNFT(account, nftTokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async batchBurnNFT(
      account: `0x${string}`,
      nftTokenIds: bigint[],
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.testErc1155Enumerable.batchBurnNFT(account, nftTokenIds);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { TestERC1155EnumerableMixin };

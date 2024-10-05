/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { ILPSFTIssuable } from "../../../../types/contracts/src/interfaces/token/ERC1155/extensions/ILPSFTIssuable";
import { ILPSFTIssuable__factory } from "../../../../types/factories/contracts/src/interfaces/token/ERC1155/extensions/ILPSFTIssuable__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function LPSFTIssuableMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private lpSftIssuable: ILPSFTIssuable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        string,
      ];

      this.lpSftIssuable = ILPSFTIssuable__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async mint(
      to: string,
      sftTokenId: bigint,
      data: Uint8Array,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftIssuable.mint(to, sftTokenId, data);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async mintBatch(
      to: string,
      sftTokenIds: bigint[],
      data: Uint8Array,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftIssuable.mintBatch(to, sftTokenIds, data);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async burn(
      from: string,
      sftTokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftIssuable.burn(from, sftTokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async burnBatch(
      from: string,
      sftTokenIds: bigint[],
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftIssuable.burnBatch(from, sftTokenIds);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { LPSFTIssuableMixin };

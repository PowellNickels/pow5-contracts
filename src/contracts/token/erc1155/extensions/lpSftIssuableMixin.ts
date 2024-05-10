/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import {
  ContractTransactionReceipt,
  ContractTransactionResponse,
  Signer,
} from "ethers";

import { ILPSFTIssuable } from "../../../../types/contracts/src/interfaces/token/ERC1155/extensions/ILPSFTIssuable";
import { ILPSFTIssuable__factory } from "../../../../types/factories/contracts/src/interfaces/token/ERC1155/extensions/ILPSFTIssuable__factory";

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
function LPSFTIssuableMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private lpSftIssuable: ILPSFTIssuable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [Signer, string];
      this.lpSftIssuable = ILPSFTIssuable__factory.connect(
        contractAddress,
        signer,
      );
    }

    async mint(
      to: string,
      sftTokenId: bigint,
      data: Uint8Array,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse = await this.lpSftIssuable.mint(
        to,
        sftTokenId,
        data,
      );
      return (await tx.wait()) as ContractTransactionReceipt;
    }

    async mintBatch(
      to: string,
      sftTokenIds: bigint[],
      data: Uint8Array,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse =
        await this.lpSftIssuable.mintBatch(to, sftTokenIds, data);
      return (await tx.wait()) as ContractTransactionReceipt;
    }

    async burn(
      from: string,
      sftTokenId: bigint,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse = await this.lpSftIssuable.burn(
        from,
        sftTokenId,
      );
      return (await tx.wait()) as ContractTransactionReceipt;
    }

    async burnBatch(
      from: string,
      sftTokenIds: bigint[],
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse =
        await this.lpSftIssuable.burnBatch(from, sftTokenIds);
      return (await tx.wait()) as ContractTransactionReceipt;
    }
  };
}

export { LPSFTIssuableMixin };

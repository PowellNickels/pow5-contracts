/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC1155 } from "../../../../types/@openzeppelin/contracts/token/ERC1155/IERC1155";
import { IERC1155__factory } from "../../../../types/factories/@openzeppelin/contracts/token/ERC1155/IERC1155__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC1155Mixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private erc1155: IERC1155;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.erc1155 = IERC1155__factory.connect(contractAddress, signer);
    }

    async balanceOf(account: string, id: bigint): Promise<bigint> {
      return await this.erc1155.balanceOf(account, id);
    }

    async balanceOfBatch(accounts: string[], ids: bigint[]): Promise<bigint[]> {
      return await this.erc1155.balanceOfBatch(accounts, ids);
    }

    async setApprovalForAll(
      operator: string,
      approved: boolean,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.erc1155.setApprovalForAll(operator, approved);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async isApprovedForAll(
      account: string,
      operator: string,
    ): Promise<boolean> {
      return await this.erc1155.isApprovedForAll(account, operator);
    }

    async safeTransferFrom(
      from: string,
      to: string,
      id: bigint,
      value: bigint,
      data: Uint8Array,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.erc1155.safeTransferFrom(from, to, id, value, data);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async safeBatchTransferFrom(
      from: string,
      to: string,
      ids: bigint[],
      values: bigint[],
      data: Uint8Array,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.erc1155.safeBatchTransferFrom(from, to, ids, values, data);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }
  };
}

export { ERC1155Mixin };

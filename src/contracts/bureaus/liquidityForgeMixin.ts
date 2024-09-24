/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { ILiquidityForge } from "../../types/contracts/src/interfaces/bureaus/ILiquidityForge";
import { ILiquidityForge__factory } from "../../types/factories/contracts/src/interfaces/bureaus/ILiquidityForge__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function LiquidityForgeMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private liquidityForge: ILiquidityForge;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.liquidityForge = ILiquidityForge__factory.connect(
        contractAddress,
        signer,
      );
    }

    async borrowPow5(
      tokenId: bigint,
      amount: bigint,
      receiver: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.liquidityForge.borrowPow5(tokenId, amount, receiver);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async repayPow5(
      tokenId: bigint,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.liquidityForge.repayPow5(tokenId, amount);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }
  };
}

export { LiquidityForgeMixin };

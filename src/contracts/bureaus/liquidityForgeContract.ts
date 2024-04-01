/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ContractTransactionResponse, Signer } from "ethers";

import { AddressBook } from "../../interfaces/addressBook";
import { LiquidityForge } from "../../types/contracts/src/bureaus/LiquidityForge";
import { LiquidityForge__factory } from "../../types/factories/contracts/src/bureaus/LiquidityForge__factory";

class LiquidityForgeContract {
  private liquidityForgeContract: LiquidityForge;

  constructor(signer: Signer, addressBook: AddressBook) {
    this.liquidityForgeContract = LiquidityForge__factory.connect(
      addressBook.liquidityForge!,
      signer,
    );
  }

  async borrowPow5(
    tokenId: bigint,
    amount: bigint,
    receiver: string,
  ): Promise<void> {
    const tx: ContractTransactionResponse =
      await this.liquidityForgeContract.borrowPow5(tokenId, amount, receiver);
    await tx.wait();
  }

  async repayPow5(tokenId: bigint, amount: bigint): Promise<void> {
    const tx: ContractTransactionResponse =
      await this.liquidityForgeContract.repayPow5(tokenId, amount);
    await tx.wait();
  }
}

export { LiquidityForgeContract };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ContractTransactionResponse, Signer } from "ethers";

import { AddressBook } from "../../interfaces/addressBook";
import { ReverseRepo } from "../../types/contracts/src/bureaus/ReverseRepo";
import { ReverseRepo__factory } from "../../types/factories/contracts/src/bureaus/ReverseRepo__factory";

class ReverseRepoContract {
  private reverseRepoContract: ReverseRepo;

  constructor(signer: Signer, addressBook: AddressBook) {
    this.reverseRepoContract = ReverseRepo__factory.connect(
      addressBook.reverseRepo!,
      signer,
    );
  }

  async initialize(
    gameTokenAmount: bigint,
    assetTokenAmount: bigint,
    receiver: string,
  ): Promise<bigint> {
    const tx: ContractTransactionResponse =
      await this.reverseRepoContract.initialize(
        gameTokenAmount,
        assetTokenAmount,
        receiver,
      );
    await tx.wait();

    // TODO
    return 0n;
  }

  async purchase(
    gameTokenAmount: bigint,
    assetTokenAmount: bigint,
    receiver: string,
  ): Promise<bigint> {
    const tx: ContractTransactionResponse =
      await this.reverseRepoContract.purchase(
        gameTokenAmount,
        assetTokenAmount,
        receiver,
      );
    await tx.wait();

    // TODO
    return 0n;
  }

  async exit(tokenId: bigint): Promise<void> {
    const tx: ContractTransactionResponse =
      await this.reverseRepoContract.exit(tokenId);
    await tx.wait();
  }
}

export { ReverseRepoContract };

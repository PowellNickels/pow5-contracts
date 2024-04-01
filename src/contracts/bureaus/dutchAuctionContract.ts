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

import { AddressBook } from "../../interfaces/addressBook";
import { DutchAuction } from "../../types/contracts/src/bureaus/DutchAuction";
import { DutchAuction__factory } from "../../types/factories/contracts/src/bureaus/DutchAuction__factory";

class DutchAuctionContract {
  private dutchAuctionContract: DutchAuction;

  constructor(signer: Signer, addressBook: AddressBook) {
    this.dutchAuctionContract = DutchAuction__factory.connect(
      addressBook.dutchAuction!,
      signer,
    );
  }

  async initialize(
    gameTokenAmount: bigint,
    assetTokenAmount: bigint,
    receiver: string,
  ): Promise<bigint> {
    const tx: ContractTransactionResponse =
      await this.dutchAuctionContract.initialize(
        gameTokenAmount,
        assetTokenAmount,
        receiver,
      );
    await tx.wait();

    // TODO
    return 0n;
  }

  async setAuction(
    slot: number,
    targetPrice: bigint,
    priceDecayConstant: bigint,
    dustLossAmount: bigint,
  ): Promise<void> {
    const tx: ContractTransactionResponse =
      await this.dutchAuctionContract.setAuction(
        slot,
        targetPrice,
        priceDecayConstant,
        dustLossAmount,
      );
    await tx.wait();
  }

  async removeAuction(slot: number): Promise<void> {
    const tx: ContractTransactionResponse =
      await this.dutchAuctionContract.removeAuction(slot);
    await tx.wait();
  }

  async getPrice(slot: number): Promise<bigint> {
    return await this.dutchAuctionContract.getPrice(slot);
  }

  async purchase(
    slot: number,
    gameTokenAmount: bigint,
    assetTokenAmount: bigint,
    receiver: string,
  ): Promise<bigint> {
    const txResponse: ContractTransactionResponse =
      await this.dutchAuctionContract.purchase(
        slot,
        gameTokenAmount,
        assetTokenAmount,
        receiver,
      );

    const receipt: ContractTransactionReceipt | null = await txResponse.wait();
    if (!receipt) {
      throw new Error("purchase() transaction failed");
    }

    console.log("purchase() receipt:", receipt);

    // TODO: Get token ID from receipt
    return 0n;
  }
}

export { DutchAuctionContract };

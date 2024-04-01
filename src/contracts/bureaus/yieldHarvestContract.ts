/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ContractTransactionResponse, Signer } from "ethers";

import { AddressBook } from "../../interfaces/addressBook";
import { YieldHarvest } from "../../types/contracts/src/bureaus/YieldHarvest";
import { YieldHarvest__factory } from "../../types/factories/contracts/src/bureaus/YieldHarvest__factory";

class YieldHarvestContract {
  private yieldHarvestContract: YieldHarvest;

  constructor(signer: Signer, addressBook: AddressBook) {
    this.yieldHarvestContract = YieldHarvest__factory.connect(
      addressBook.yieldHarvest!,
      signer,
    );
  }

  async lendLpSft(tokenId: bigint): Promise<void> {
    const tx: ContractTransactionResponse =
      await this.yieldHarvestContract.lendLpSft(tokenId);
    await tx.wait();
  }

  async withdrawLpSft(tokenId: bigint): Promise<void> {
    const tx: ContractTransactionResponse =
      await this.yieldHarvestContract.withdrawLpSft(tokenId);
    await tx.wait();
  }
}

export { YieldHarvestContract };

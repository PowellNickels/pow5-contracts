/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuction } from "../../types/contracts/src/interfaces/bureaus/IDutchAuction";
import { IDutchAuction__factory } from "../../types/factories/contracts/src/interfaces/bureaus/IDutchAuction__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DutchAuctionMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private dutchAuction: IDutchAuction;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.dutchAuction = IDutchAuction__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async initialize(
      gameTokenAmount: bigint,
      assetTokenAmount: bigint,
      receiver: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuction.initialize(
            gameTokenAmount,
            assetTokenAmount,
            receiver,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async isInitialized(): Promise<boolean> {
      return await this.dutchAuction.isInitialized();
    }

    async setAuction(
      slot: bigint,
      targetPrice: bigint,
      priceDecayConstant: bigint,
      dustLossAmount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuction.setAuction(
            slot,
            targetPrice,
            priceDecayConstant,
            dustLossAmount,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async removeAuction(
      slot: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuction.removeAuction(slot);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async getPrice(slot: bigint): Promise<bigint> {
      return await this.dutchAuction.getPrice(slot);
    }

    async purchase(
      slot: bigint,
      gameTokenAmount: bigint,
      assetTokenAmount: bigint,
      receiver: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuction.purchase(
            slot,
            gameTokenAmount,
            assetTokenAmount,
            receiver,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async exit(tokenId: bigint): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuction.exit(tokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { DutchAuctionMixin };

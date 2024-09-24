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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DutchAuctionMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private dutchAuction: IDutchAuction;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.dutchAuction = IDutchAuction__factory.connect(
        contractAddress,
        signer,
      );
    }

    async initialize(
      gameTokenAmount: bigint,
      assetTokenAmount: bigint,
      receiver: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.dutchAuction.initialize(
          gameTokenAmount,
          assetTokenAmount,
          receiver,
        );
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async setAuction(
      slot: bigint,
      targetPrice: bigint,
      priceDecayConstant: bigint,
      dustLossAmount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.dutchAuction.setAuction(
          slot,
          targetPrice,
          priceDecayConstant,
          dustLossAmount,
        );
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async removeAuction(
      slot: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.dutchAuction.removeAuction(slot);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async getPrice(slot: bigint): Promise<bigint> {
      return await this.dutchAuction.getPrice(slot);
    }

    async purchase(
      slot: bigint,
      gameTokenAmount: bigint,
      assetTokenAmount: bigint,
      receiver: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.dutchAuction.purchase(
          slot,
          gameTokenAmount,
          assetTokenAmount,
          receiver,
        );
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async exit(tokenId: bigint): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.dutchAuction.exit(tokenId);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }
  };
}

export { DutchAuctionMixin };

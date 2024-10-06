/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionAdminActions } from "../../../types/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionAdminActions";
import { IDutchAuctionAdminActions__factory } from "../../../types/factories/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionAdminActions__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DutchAuctionAdminActionsMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private dutchAuctionAdminActions: IDutchAuctionAdminActions;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.dutchAuctionAdminActions =
        IDutchAuctionAdminActions__factory.connect(
          contractAddress,
          contractRunner,
        );
    }

    async initialize(
      pow1Amount: bigint,
      marketTokenAmount: bigint,
      receiver: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuctionAdminActions.initialize(
            pow1Amount,
            marketTokenAmount,
            receiver,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async isInitialized(): Promise<boolean> {
      return await this.dutchAuctionAdminActions.isInitialized();
    }

    async setAuction(
      slot: bigint,
      targetPrice: bigint,
      priceDecayConstant: bigint,
      dustLossAmount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuctionAdminActions.setAuction(
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
          await this.dutchAuctionAdminActions.removeAuction(slot);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { DutchAuctionAdminActionsMixin };

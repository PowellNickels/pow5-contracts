/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionAdminActions } from "../../../types/contracts/src/interfaces/bureaus/dutchAuction/IDutchAuctionAdminActions";
import { IDutchAuctionAdminActions__factory } from "../../../types/factories/contracts/src/interfaces/bureaus/dutchAuction/IDutchAuctionAdminActions__factory";
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
      gameTokenAmount: bigint,
      assetTokenAmount: bigint,
      receiver: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuctionAdminActions.initialize(
            gameTokenAmount,
            assetTokenAmount,
            receiver,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async isInitialized(): Promise<boolean> {
      return await this.dutchAuctionAdminActions.isInitialized();
    }

    async createAuction(
      vrgdaParams: {
        targetPrice: bigint;
        priceDecayPercent: bigint;
        logisticLimit: bigint;
        timeScale: bigint;
        soldBySwitch: bigint;
        switchTime: bigint;
        perTimeUnit: bigint;
      },
      dustLossAmount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dutchAuctionAdminActions.createAuction(
            vrgdaParams,
            dustLossAmount,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { DutchAuctionAdminActionsMixin };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDexTokenSwapper } from "../../../types/contracts/src/interfaces/token/routes/IDexTokenSwapper";
import { IDexTokenSwapper__factory } from "../../../types/factories/contracts/src/interfaces/token/routes/IDexTokenSwapper__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DexTokenSwapperMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private dexTokenSwapper: IDexTokenSwapper;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.dexTokenSwapper = IDexTokenSwapper__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async buyMarketToken(
      stableTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dexTokenSwapper.buyMarketToken(
            stableTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async sellMarketToken(
      marketTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dexTokenSwapper.sellMarketToken(
            marketTokenAmount,
            recipient,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async exit(): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.dexTokenSwapper.exit();

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { DexTokenSwapperMixin };

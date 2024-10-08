/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniV3Swapper } from "../../../types/contracts/src/interfaces/token/routes/IUniV3Swapper";
import { IUniV3Swapper__factory } from "../../../types/factories/contracts/src/interfaces/token/routes/IUniV3Swapper__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniV3SwapperMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private uniV3Swapper: IUniV3Swapper;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.uniV3Swapper = IUniV3Swapper__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async buyGameToken(
      assetTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniV3Swapper.buyGameToken(assetTokenAmount, recipient);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async sellGameToken(
      gameTokenAmount: bigint,
      recipient: `0x${string}`,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniV3Swapper.sellGameToken(gameTokenAmount, recipient);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async exit(): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniV3Swapper.exit();

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { UniV3SwapperMixin };

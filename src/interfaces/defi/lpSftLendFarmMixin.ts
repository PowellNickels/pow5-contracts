/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { ILPSFTLendFarm } from "../../types/contracts/src/interfaces/defi/ILPSFTLendFarm";
import { ILPSFTLendFarm__factory } from "../../types/factories/contracts/src/interfaces/defi/ILPSFTLendFarm__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function LpSftLendFarmMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private lpSftLendFarm: ILPSFTLendFarm;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        string,
      ];

      this.lpSftLendFarm = ILPSFTLendFarm__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async lendLpSft(
      tokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftLendFarm.lendLpSft(tokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async lendLpSftBatch(
      tokenIds: bigint[],
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftLendFarm.lendLpSftBatch(tokenIds);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async withdrawLpSft(
      tokenId: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftLendFarm.withdrawLpSft(tokenId);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async withdrawLpSftBatch(
      tokenIds: bigint[],
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.lpSftLendFarm.withdrawLpSftBatch(tokenIds);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { LpSftLendFarmMixin };

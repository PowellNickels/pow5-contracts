/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IReverseRepo } from "../../types/contracts/src/interfaces/bureaus/IReverseRepo";
import { IReverseRepo__factory } from "../../types/factories/contracts/src/interfaces/bureaus/IReverseRepo__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ReverseRepoMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private reverseRepo: IReverseRepo;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.reverseRepo = IReverseRepo__factory.connect(contractAddress, signer);
    }

    async initialize(
      gameTokenAmount: bigint,
      assetTokenAmount: bigint,
      receiver: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.reverseRepo.initialize(
          gameTokenAmount,
          assetTokenAmount,
          receiver,
        );
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async purchase(
      gameTokenAmount: bigint,
      assetTokenAmount: bigint,
      receiver: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.reverseRepo.purchase(
          gameTokenAmount,
          assetTokenAmount,
          receiver,
        );
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async exit(tokenId: bigint): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.reverseRepo.exit(tokenId);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }
  };
}

export { ReverseRepoMixin };

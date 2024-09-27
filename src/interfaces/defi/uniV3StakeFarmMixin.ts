/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniV3StakeFarm } from "../../types/contracts/src/interfaces/defi/IUniV3StakeFarm";
import { IUniV3StakeFarm__factory } from "../../types/factories/contracts/src/interfaces/defi/IUniV3StakeFarm__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniV3StakeFarmMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private uniV3StakeFarm: IUniV3StakeFarm;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.uniV3StakeFarm = IUniV3StakeFarm__factory.connect(
        contractAddress,
        signer,
      );
    }

    async isInitialized(): Promise<boolean> {
      return await this.uniV3StakeFarm.isInitialized();
    }

    async createIncentive(
      rewardAmount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniV3StakeFarm.createIncentive(rewardAmount);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async enter(tokenId: bigint): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniV3StakeFarm.enter(tokenId);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async exit(tokenId: bigint): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniV3StakeFarm.exit(tokenId);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }
  };
}

export { UniV3StakeFarmMixin };

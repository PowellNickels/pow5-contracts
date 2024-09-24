/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC20InterestFarm } from "../../types/contracts/src/interfaces/defi/IERC20InterestFarm";
import { IERC20InterestFarm__factory } from "../../types/factories/contracts/src/interfaces/defi/IERC20InterestFarm__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC20InterestFarmMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private interestFarm: IERC20InterestFarm;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.interestFarm = IERC20InterestFarm__factory.connect(
        contractAddress,
        signer,
      );
    }

    async recordLoan(
      lpSftAddress: string,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.interestFarm.recordLoan(lpSftAddress, amount);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async recordRepayment(
      lpSftAddress: string,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.interestFarm.recordRepayment(lpSftAddress, amount);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async claimReward(
      lpSftAddress: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.interestFarm.claimReward(lpSftAddress);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }
  };
}

export { ERC20InterestFarmMixin };

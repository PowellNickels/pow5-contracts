/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { WETH9 } from "../../../types/contracts/depends/canonical-weth/WETH9";
import { WETH9__factory } from "../../../types/factories/contracts/depends/canonical-weth/WETH9__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function WrappedNativeMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private wrappedNative: WETH9;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.wrappedNative = WETH9__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async deposit(wad: bigint): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.wrappedNative.deposit({
            value: wad,
          });

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async withdraw(wad: bigint): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.wrappedNative.withdraw(wad);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { WrappedNativeMixin };

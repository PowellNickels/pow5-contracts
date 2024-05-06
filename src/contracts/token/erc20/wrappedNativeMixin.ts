/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import {
  ContractTransactionReceipt,
  ContractTransactionResponse,
  Signer,
} from "ethers";

import { WETH9 } from "../../../types/contracts/depends/canonical-weth/WETH9";
import { WETH9__factory } from "../../../types/factories/contracts/depends/canonical-weth/WETH9__factory";

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
function WrappedNativeMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private wrappedNative: WETH9;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [Signer, string];
      this.wrappedNative = WETH9__factory.connect(contractAddress, signer);
    }

    async deposit(wad: bigint): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse = await this.wrappedNative.deposit({
        value: wad,
      });
      return (await tx.wait()) as ContractTransactionReceipt;
    }

    async withdraw(wad: bigint): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse =
        await this.wrappedNative.withdraw(wad);
      return (await tx.wait()) as ContractTransactionReceipt;
    }
  };
}

export { WrappedNativeMixin };

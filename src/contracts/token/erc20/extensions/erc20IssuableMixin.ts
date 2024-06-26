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

import { IERC20Issuable } from "../../../../types/contracts/src/interfaces/token/ERC20/extensions/IERC20Issuable";
import { IERC20Issuable__factory } from "../../../../types/factories/contracts/src/interfaces/token/ERC20/extensions/IERC20Issuable__factory";

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
function ERC20IssuableMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private erc20Issuable: IERC20Issuable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [Signer, string];
      this.erc20Issuable = IERC20Issuable__factory.connect(
        contractAddress,
        signer,
      );
    }

    async mint(
      to: string,
      amount: bigint,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse = await this.erc20Issuable.mint(
        to,
        amount,
      );
      return (await tx.wait()) as ContractTransactionReceipt;
    }

    async burn(
      from: string,
      amount: bigint,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse = await this.erc20Issuable.burn(
        from,
        amount,
      );
      return (await tx.wait()) as ContractTransactionReceipt;
    }
  };
}

export { ERC20IssuableMixin };

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

import { IERC20 } from "../../../../types/@openzeppelin/contracts/token/ERC20/IERC20";
import { IERC20__factory } from "../../../../types/factories/@openzeppelin/contracts/token/ERC20/IERC20__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC20Mixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private erc20: IERC20;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [Signer, string];
      this.erc20 = IERC20__factory.connect(contractAddress, signer);
    }

    async totalSupply(): Promise<bigint> {
      return await this.erc20.totalSupply();
    }

    async balanceOf(account: string): Promise<bigint> {
      return await this.erc20.balanceOf(account);
    }

    async transfer(
      to: string,
      value: bigint,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse = await this.erc20.transfer(
        to,
        value,
      );
      return (await tx.wait()) as ContractTransactionReceipt;
    }

    async allowance(owner: string, spender: string): Promise<bigint> {
      return await this.erc20.allowance(owner, spender);
    }

    async approve(
      spender: string,
      value: bigint,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse = await this.erc20.approve(
        spender,
        value,
      );
      return (await tx.wait()) as ContractTransactionReceipt;
    }

    async transferFrom(
      from: string,
      to: string,
      value: bigint,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse = await this.erc20.transferFrom(
        from,
        to,
        value,
      );
      return (await tx.wait()) as ContractTransactionReceipt;
    }
  };
}

export { ERC20Mixin };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IERC20 } from "../../../../types/@openzeppelin/contracts/token/ERC20/IERC20";
import { IERC20__factory } from "../../../../types/factories/@openzeppelin/contracts/token/ERC20/IERC20__factory";
import { BaseMixin } from "../../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function ERC20Mixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private erc20: IERC20;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        string,
      ];

      this.erc20 = IERC20__factory.connect(contractAddress, contractRunner);
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
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc20.transfer(to, value);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async allowance(owner: string, spender: string): Promise<bigint> {
      return await this.erc20.allowance(owner, spender);
    }

    async approve(
      spender: string,
      value: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse = await this.erc20.approve(
          spender,
          value,
        );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async transferFrom(
      from: string,
      to: string,
      value: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.erc20.transferFrom(from, to, value);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { ERC20Mixin };

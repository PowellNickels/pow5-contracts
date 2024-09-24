/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { TestERC20Mintable } from "../../../../../types/contracts/test/token/erc20/extensions/TestERC20Mintable";
import { TestERC20Mintable__factory } from "../../../../../types/factories/contracts/test/token/erc20/extensions/TestERC20Mintable__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function TestERC20MintableMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private testErc1155Enumerable: TestERC20Mintable;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.testErc1155Enumerable = TestERC20Mintable__factory.connect(
        contractAddress,
        signer,
      );
    }

    async mint(
      account: string,
      amount: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.testErc1155Enumerable.mint(account, amount);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }
  };
}

export { TestERC20MintableMixin };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniswapV3Factory } from "../../types/contracts/interfaces/uniswap-v3-core/IUniswapV3Factory";
import { IUniswapV3Factory__factory } from "../../types/factories/contracts/interfaces/uniswap-v3-core/IUniswapV3Factory__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniswapV3FactoryMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private uniswapV3Factory: IUniswapV3Factory;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.uniswapV3Factory = IUniswapV3Factory__factory.connect(
        contractAddress,
        signer,
      );
    }

    async poolCodeHash(): Promise<string> {
      return await this.uniswapV3Factory.poolCodeHash();
    }

    async owner(): Promise<string> {
      return await this.uniswapV3Factory.owner();
    }

    async feeAmountTickSpacing(fee: number): Promise<number> {
      return Number(await this.uniswapV3Factory.feeAmountTickSpacing(fee));
    }

    async getPool(
      tokenA: string,
      tokenB: string,
      fee: number,
    ): Promise<string> {
      return await this.uniswapV3Factory.getPool(tokenA, tokenB, fee);
    }

    async createPool(
      tokenA: string,
      tokenB: string,
      fee: number,
    ): Promise<string> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3Factory.createPool(tokenA, tokenB, fee);
      // TODO
      console.log("tx:", tx);
      return "";
    }
  };
}

export { UniswapV3FactoryMixin };

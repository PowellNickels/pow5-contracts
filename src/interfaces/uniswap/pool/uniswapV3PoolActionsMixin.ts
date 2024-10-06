/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniswapV3PoolActions } from "../../../types/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolActions";
import { IUniswapV3PoolActions__factory } from "../../../types/factories/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolActions__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniswapV3PoolActionsMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private uniswapV3PoolActions: IUniswapV3PoolActions;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        string,
      ];

      this.uniswapV3PoolActions = IUniswapV3PoolActions__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async initialize(
      sqrtPriceX96: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniswapV3PoolActions.initialize(sqrtPriceX96);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async mint(
      recipient: string,
      tickLower: number,
      tickUpper: number,
      amount: bigint,
      data: string,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniswapV3PoolActions.mint(
            recipient,
            tickLower,
            tickUpper,
            amount,
            data,
          );

        const receipt: ethers.ContractTransactionReceipt =
          (await tx.wait()) as ethers.ContractTransactionReceipt;

        return this.getValues(receipt, "Mint", (result: ethers.Result) => {
          return {
            amount0: result.getValue("amount0") as bigint,
            amount1: result.getValue("amount1") as bigint,
          };
        });
      });
    }

    async collect(
      recipient: string,
      tickLower: number,
      tickUpper: number,
      amount0Requested: bigint,
      amount1Requested: bigint,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniswapV3PoolActions.collect(
            recipient,
            tickLower,
            tickUpper,
            amount0Requested,
            amount1Requested,
          );

        const receipt: ethers.ContractTransactionReceipt =
          (await tx.wait()) as ethers.ContractTransactionReceipt;

        return this.getValues(receipt, "Collect", (result: ethers.Result) => {
          return {
            amount0: result.getValue("amount0") as bigint,
            amount1: result.getValue("amount1") as bigint,
          };
        });
      });
    }

    async burn(
      tickLower: number,
      tickUpper: number,
      amount: bigint,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniswapV3PoolActions.burn(tickLower, tickUpper, amount);

        const receipt: ethers.ContractTransactionReceipt =
          (await tx.wait()) as ethers.ContractTransactionReceipt;

        return this.getValues(receipt, "Burn", (result: ethers.Result) => {
          return {
            amount0: result.getValue("amount0") as bigint,
            amount1: result.getValue("amount1") as bigint,
          };
        });
      });
    }

    async swap(
      recipient: string,
      zeroForOne: boolean,
      amountSpecified: bigint,
      sqrtPriceLimitX96: bigint,
      data: string,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniswapV3PoolActions.swap(
            recipient,
            zeroForOne,
            amountSpecified,
            sqrtPriceLimitX96,
            data,
          );

        const receipt: ethers.ContractTransactionReceipt =
          (await tx.wait()) as ethers.ContractTransactionReceipt;

        return this.getValues(receipt, "Mint", (result: ethers.Result) => {
          return {
            amount0: result.getValue("amount0") as bigint,
            amount1: result.getValue("amount1") as bigint,
          };
        });
      });
    }

    async flash(
      recipient: string,
      amount0: bigint,
      amount1: bigint,
      data: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniswapV3PoolActions.flash(
            recipient,
            amount0,
            amount1,
            data,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async increaseObservationCardinalityNext(
      observationCardinalityNext: number,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.uniswapV3PoolActions.increaseObservationCardinalityNext(
            observationCardinalityNext,
          );

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { UniswapV3PoolActionsMixin };

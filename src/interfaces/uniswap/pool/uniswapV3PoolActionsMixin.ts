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

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniswapV3PoolActionsMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends Base {
    private uniswapV3PoolActions: IUniswapV3PoolActions;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.uniswapV3PoolActions = IUniswapV3PoolActions__factory.connect(
        contractAddress,
        signer,
      );
    }

    async initialize(
      sqrtPriceX96: bigint,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolActions.initialize(sqrtPriceX96);
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async mint(
      recipient: string,
      tickLower: number,
      tickUpper: number,
      amount: bigint,
      data: string,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolActions.mint(
          recipient,
          tickLower,
          tickUpper,
          amount,
          data,
        );
      const receipt = (await tx.wait()) as ethers.ContractTransactionReceipt;
      console.log("receipt:", receipt);
      // TODO
      //return {amount0: receipt.events[0].data, amount1: receipt.events[1].data};
      return { amount0: 0n, amount1: 0n };
    }

    async collect(
      recipient: string,
      tickLower: number,
      tickUpper: number,
      amount0Requested: bigint,
      amount1Requested: bigint,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolActions.collect(
          recipient,
          tickLower,
          tickUpper,
          amount0Requested,
          amount1Requested,
        );
      const receipt = (await tx.wait()) as ethers.ContractTransactionReceipt;
      console.log("receipt:", receipt);
      // TODO
      //return {amount0: receipt.events[0].data, amount1: receipt.events[1].data};
      return { amount0: 0n, amount1: 0n };
    }

    async burn(
      tickLower: number,
      tickUpper: number,
      amount: bigint,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolActions.burn(tickLower, tickUpper, amount);
      const receipt = (await tx.wait()) as ethers.ContractTransactionReceipt;
      console.log("receipt:", receipt);
      // TODO
      //return {amount0: receipt.events[0].data, amount1: receipt.events[1].data};
      return { amount0: 0n, amount1: 0n };
    }

    async swap(
      recipient: string,
      zeroForOne: boolean,
      amountSpecified: bigint,
      sqrtPriceLimitX96: bigint,
      data: string,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolActions.swap(
          recipient,
          zeroForOne,
          amountSpecified,
          sqrtPriceLimitX96,
          data,
        );
      const receipt = (await tx.wait()) as ethers.ContractTransactionReceipt;
      console.log("receipt:", receipt);
      // TODO
      //return {amount0: receipt.events[0].data, amount1: receipt.events[1].data};
      return { amount0: 0n, amount1: 0n };
    }

    async flash(
      recipient: string,
      amount0: bigint,
      amount1: bigint,
      data: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolActions.flash(
          recipient,
          amount0,
          amount1,
          data,
        );
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async increaseObservationCardinalityNext(
      observationCardinalityNext: number,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolActions.increaseObservationCardinalityNext(
          observationCardinalityNext,
        );
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }
  };
}

export { UniswapV3PoolActionsMixin };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniswapV3PoolOwnerActions } from "../../../types/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolOwnerActions";
import { IUniswapV3PoolOwnerActions__factory } from "../../../types/factories/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolOwnerActions__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniswapV3PoolOwnerActionsMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends Base {
    private uniswapV3PoolOwnerActions: IUniswapV3PoolOwnerActions;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [ethers.Signer, string];
      this.uniswapV3PoolOwnerActions =
        IUniswapV3PoolOwnerActions__factory.connect(contractAddress, signer);
    }

    async setFeeProtocol(
      feeProtocol0: number,
      feeProtocol1: number,
    ): Promise<ethers.ContractTransactionReceipt> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolOwnerActions.setFeeProtocol(
          feeProtocol0,
          feeProtocol1,
        );
      return (await tx.wait()) as ethers.ContractTransactionReceipt;
    }

    async collectProtocol(
      recipient: string,
      amount0Requested: bigint,
      amount1Requested: bigint,
    ): Promise<{ amount0: bigint; amount1: bigint }> {
      const tx: ethers.ContractTransactionResponse =
        await this.uniswapV3PoolOwnerActions.collectProtocol(
          recipient,
          amount0Requested,
          amount1Requested,
        );
      const receipt = (await tx.wait()) as ethers.ContractTransactionReceipt;
      console.log("receipt:", receipt);
      // TODO
      //return {amount0: receipt.events[0].data, amount1: receipt.events[1].data};
      return { amount0: 0n, amount1: 0n };
    }
  };
}

export { UniswapV3PoolOwnerActionsMixin };

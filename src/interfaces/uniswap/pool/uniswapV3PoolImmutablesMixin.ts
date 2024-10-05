/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IUniswapV3PoolImmutables } from "../../../types/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolImmutables";
import { IUniswapV3PoolImmutables__factory } from "../../../types/factories/contracts/interfaces/uniswap-v3-core/pool/IUniswapV3PoolImmutables__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function UniswapV3PoolImmutablesMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private uniswapV3PoolImmutables: IUniswapV3PoolImmutables;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        string,
      ];

      this.uniswapV3PoolImmutables = IUniswapV3PoolImmutables__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async factory(): Promise<string> {
      return await this.uniswapV3PoolImmutables.factory();
    }

    async token0(): Promise<string> {
      return await this.uniswapV3PoolImmutables.token0();
    }

    async token1(): Promise<string> {
      return await this.uniswapV3PoolImmutables.token1();
    }

    async fee(): Promise<bigint> {
      return await this.uniswapV3PoolImmutables.fee();
    }

    async tickSpacing(): Promise<bigint> {
      return await this.uniswapV3PoolImmutables.tickSpacing();
    }

    async maxLiquidityPerTick(): Promise<bigint> {
      return await this.uniswapV3PoolImmutables.maxLiquidityPerTick();
    }
  };
}

export { UniswapV3PoolImmutablesMixin };

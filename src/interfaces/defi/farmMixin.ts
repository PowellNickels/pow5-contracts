/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IFarm } from "../../types/contracts/src/interfaces/defi/IFarm";
import { IFarm__factory } from "../../types/factories/contracts/src/interfaces/defi/IFarm__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function FarmMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private farm: IFarm;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        string,
      ];

      this.farm = IFarm__factory.connect(contractAddress, contractRunner);
    }

    async rewardPerToken(): Promise<bigint> {
      return this.farm.rewardPerToken();
    }

    async earned(account: string): Promise<bigint> {
      return this.farm.earned(account);
    }

    async balanceOf(account: string): Promise<bigint> {
      return this.farm.balanceOf(account);
    }

    async totalLiquidity(): Promise<bigint> {
      return this.farm.totalLiquidity();
    }
  };
}

export { FarmMixin };

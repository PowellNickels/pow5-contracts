/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IYieldHarvest } from "../../types/contracts/src/interfaces/bureaus/IYieldHarvest";
import { IYieldHarvest__factory } from "../../types/factories/contracts/src/interfaces/bureaus/IYieldHarvest__factory";
import { BaseMixin } from "../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function YieldHarvestMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private yieldHarvest: IYieldHarvest;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        string,
      ];

      this.yieldHarvest = IYieldHarvest__factory.connect(
        contractAddress,
        contractRunner,
      );

      // TODO: Use yieldHarvest
      this.yieldHarvest;
    }
  };
}

export { YieldHarvestMixin };

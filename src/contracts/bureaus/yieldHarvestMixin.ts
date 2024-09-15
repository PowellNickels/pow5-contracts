/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { IYieldHarvest } from "../../types/contracts/src/interfaces/bureaus/IYieldHarvest";
import { IYieldHarvest__factory } from "../../types/factories/contracts/src/interfaces/bureaus/IYieldHarvest__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function YieldHarvestMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private yieldHarvest: IYieldHarvest;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [Signer, string];
      this.yieldHarvest = IYieldHarvest__factory.connect(
        contractAddress,
        signer,
      );
    }
  };
}

export { YieldHarvestMixin };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionState } from "../../../types/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionState";
import { IDutchAuctionState__factory } from "../../../types/factories/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionState__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DutchAuctionStateMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private dutchAuctionState: IDutchAuctionState;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.dutchAuctionState = IDutchAuctionState__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async getPrice(slot: bigint): Promise<bigint> {
      return await this.dutchAuctionState.getPrice(slot);
    }
  };
}

export { DutchAuctionStateMixin };

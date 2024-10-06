/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionState } from "../../../types/contracts/src/interfaces/bureaus/dutchAuction/IDutchAuctionState";
import { IDutchAuctionState__factory } from "../../../types/factories/contracts/src/interfaces/bureaus/dutchAuction/IDutchAuctionState__factory";
import { BaseMixin } from "../../baseMixin";

interface VRGDAParams {
  targetPrice: bigint;
  priceDecayPercent: bigint;
  logisticLimit: bigint;
  timeScale: bigint;
  soldBySwitch: bigint;
  switchTime: bigint;
  perTimeUnit: bigint;
}

interface Auction {
  lpNftTokenId: bigint;
  auctionStartTime: bigint;
  sold: bigint;
  vrgdaParams: VRGDAParams;
}

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

    async getAuctions(): Promise<Auction[]> {
      const auctions: IDutchAuctionState.AuctionSlotStructOutput[] =
        await this.dutchAuctionState.getAuctions();

      return auctions.map(
        (auction: IDutchAuctionState.AuctionSlotStructOutput): Auction => {
          const { lpNftTokenId, auctionStartTime, sold, vrgdaParams } = auction;
          const {
            targetPrice,
            priceDecayPercent,
            logisticLimit,
            timeScale,
            soldBySwitch,
            switchTime,
            perTimeUnit,
          } = vrgdaParams;

          return {
            lpNftTokenId,
            auctionStartTime,
            sold,
            vrgdaParams: {
              targetPrice,
              priceDecayPercent,
              logisticLimit,
              timeScale,
              soldBySwitch,
              switchTime,
              perTimeUnit,
            },
          };
        },
      );
    }

    async getAuction(lpNftTokenId: bigint): Promise<Auction> {
      const auction: IDutchAuctionState.AuctionSlotStructOutput =
        await this.dutchAuctionState.getAuction(lpNftTokenId);

      const { lpNftTokenId: id, auctionStartTime, sold, vrgdaParams } = auction;
      const {
        targetPrice,
        priceDecayPercent,
        logisticLimit,
        timeScale,
        soldBySwitch,
        switchTime,
        perTimeUnit,
      } = vrgdaParams;

      return {
        lpNftTokenId: id,
        auctionStartTime,
        sold,
        vrgdaParams: {
          targetPrice,
          priceDecayPercent,
          logisticLimit,
          timeScale,
          soldBySwitch,
          switchTime,
          perTimeUnit,
        },
      };
    }
  };
}

export { DutchAuctionStateMixin };

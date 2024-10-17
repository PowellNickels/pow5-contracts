/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionRoutes } from "../../../types/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionRoutes";
import { IDutchAuctionRoutes__factory } from "../../../types/factories/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuctionRoutes__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function DutchAuctionRoutesMixin<T extends new (...args: any[]) => {}>(
  Base: T,
) {
  return class extends BaseMixin(Base) {
    private dutchAuctionRoutes: IDutchAuctionRoutes;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        `0x${string}`,
      ];

      this.dutchAuctionRoutes = IDutchAuctionRoutes__factory.connect(
        contractAddress,
        contractRunner,
      );
    }

    async pow1Token(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.pow1Token()) as `0x${string}`;
    }

    async pow5Token(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.pow5Token()) as `0x${string}`;
    }

    async marketToken(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.marketToken()) as `0x${string}`;
    }

    async stableToken(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.stableToken()) as `0x${string}`;
    }

    async lpSft(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.lpSft()) as `0x${string}`;
    }

    async pow1MarketPool(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.pow1MarketPool()) as `0x${string}`;
    }

    async pow1MarketSwapper(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.pow1MarketSwapper()) as `0x${string}`;
    }

    async pow5StableSwapper(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.pow5StableSwapper()) as `0x${string}`;
    }

    async marketStableSwapper(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.marketStableSwapper()) as `0x${string}`;
    }

    async pow1MarketPooler(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.pow1MarketPooler()) as `0x${string}`;
    }

    async pow1LpNftStakeFarm(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.pow1LpNftStakeFarm()) as `0x${string}`;
    }

    async uniswapV3NftManager(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.uniswapV3NftManager()) as `0x${string}`;
    }
  };
}

export { DutchAuctionRoutesMixin };

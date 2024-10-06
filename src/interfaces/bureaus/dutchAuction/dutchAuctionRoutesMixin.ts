/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IDutchAuctionRoutes } from "../../../types/contracts/src/interfaces/bureaus/dutchAuction/IDutchAuctionRoutes";
import { IDutchAuctionRoutes__factory } from "../../../types/factories/contracts/src/interfaces/bureaus/dutchAuction/IDutchAuctionRoutes__factory";
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

    async assetToken(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.assetToken()) as `0x${string}`;
    }

    async gameToken(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.gameToken()) as `0x${string}`;
    }

    async lpNftStakeFarm(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.lpNftStakeFarm()) as `0x${string}`;
    }

    async lpSft(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.lpSft()) as `0x${string}`;
    }

    async uniV3Pooler(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.uniV3Pooler()) as `0x${string}`;
    }

    async uniV3Swapper(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.uniV3Swapper()) as `0x${string}`;
    }

    async uniswapV3NftManager(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.uniswapV3NftManager()) as `0x${string}`;
    }

    async uniswapV3Pool(): Promise<`0x${string}`> {
      return (await this.dutchAuctionRoutes.uniswapV3Pool()) as `0x${string}`;
    }
  };
}

export { DutchAuctionRoutesMixin };

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { IERC20Metadata } from "../../../../../types/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata";
import { IERC20Metadata__factory } from "../../../../../types/factories/@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata__factory";

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
function ERC20MetadataMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private erc20Metadata: IERC20Metadata;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [Signer, string];
      this.erc20Metadata = IERC20Metadata__factory.connect(
        contractAddress,
        signer,
      );
    }

    async name(): Promise<string> {
      return await this.erc20Metadata.name();
    }

    async symbol(): Promise<string> {
      return await this.erc20Metadata.symbol();
    }

    async decimals(): Promise<bigint> {
      return await this.erc20Metadata.decimals();
    }
  };
}

export { ERC20MetadataMixin };

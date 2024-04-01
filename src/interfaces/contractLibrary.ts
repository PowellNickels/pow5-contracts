/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0
 * See the file LICENSE.txt for more information.
 */

import { DutchAuctionContract } from "../contracts/bureaus/dutchAuctionContract";
import { LiquidityForgeContract } from "../contracts/bureaus/liquidityForgeContract";
import { ReverseRepoContract } from "../contracts/bureaus/reverseRepoContract";
import { YieldHarvestContract } from "../contracts/bureaus/yieldHarvestContract";
import { DeFiManagerContract } from "../contracts/defi/defiManagerContract";
import { POW5InterestFarmContract } from "../contracts/defi/pow5InterestFarmContract";
import { LPPOW1Contract } from "../contracts/token/erc20/lpPow1Contract";
import { LPPOW5Contract } from "../contracts/token/erc20/lpPow5Contract";
import { NOPOW5Contract } from "../contracts/token/erc20/noPow5Contract";
import { POW1Contract } from "../contracts/token/erc20/pow1Contract";
import { POW5Contract } from "../contracts/token/erc20/pow5Contract";
import { WrappedNativeContract } from "../contracts/token/erc20/wrappedNativeContract";
import { LPSFTContract } from "../contracts/token/erc1155/lpSftContract";
import { NOLPSFTContract } from "../contracts/token/erc1155/noLpSftContract";
import { ERC20Contract } from "../contracts/zeppelin/token/erc20/erc20Contract";

/**
 * @description Contract library interface
 */
interface ContractLibrary {
  defiManagerContract: DeFiManagerContract;
  dutchAuctionContract: DutchAuctionContract;
  liquidityForgeContract: LiquidityForgeContract;
  lpPow1Contract: LPPOW1Contract;
  lpPow5Contract: LPPOW5Contract;
  lpSftContract: LPSFTContract;
  noLpSftContract: NOLPSFTContract;
  noPow5Contract: NOPOW5Contract;
  pow1Contract: POW1Contract;
  pow5Contract: POW5Contract;
  pow5InterestFarmContract: POW5InterestFarmContract;
  reverseRepoContract: ReverseRepoContract;
  usdcContract: ERC20Contract;
  wrappedNativeContract: WrappedNativeContract;
  yieldHarvestContract: YieldHarvestContract;
}

export { ContractLibrary };

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

import { DutchAuctionContract } from "./bureaus/dutchAuctionContract";
import { LiquidityForgeContract } from "./bureaus/liquidityForgeContract";
import { ReverseRepoContract } from "./bureaus/reverseRepoContract";
import { YieldHarvestContract } from "./bureaus/yieldHarvestContract";
import { DeFiManagerContract } from "./defi/defiManagerContract";
import { POW1LpNftStakeFarmContract } from "./defi/pow1LpNftStakeFarmContract";
import { POW1LpSftLendFarmContract } from "./defi/pow1LpSftLendFarmContract";
import { POW5InterestFarmContract } from "./defi/pow5InterestFarmContract";
import { POW5LpNftStakeFarmContract } from "./defi/pow5LpNftStakeFarmContract";
import { POW5LpSftLendFarmContract } from "./defi/pow5LpSftLendFarmContract";
import { LPPOW1Contract } from "./token/erc20/lpPow1Contract";
import { LPPOW5Contract } from "./token/erc20/lpPow5Contract";
import { NOPOW5Contract } from "./token/erc20/noPow5Contract";
import { POW1Contract } from "./token/erc20/pow1Contract";
import { POW5Contract } from "./token/erc20/pow5Contract";
import { WrappedNativeContract } from "./token/erc20/wrappedNativeContract";
import { LPSFTContract } from "./token/erc1155/lpSftContract";
import { NOLPSFTContract } from "./token/erc1155/noLpSftContract";
import { UniV3SwapperContract } from "./token/routes/uniV3SwapperContract";
import { UniswapV3PoolContract } from "./uniswap/pool/uniswapV3PoolContract";
import { ERC20Contract } from "./zeppelin/token/erc20/erc20Contract";

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
  pow1LpNftStakeFarmContract: POW1LpNftStakeFarmContract;
  pow1LpSftLendFarmContract: POW1LpSftLendFarmContract;
  pow1PoolContract: UniswapV3PoolContract;
  pow1SwapperContract: UniV3SwapperContract;
  pow5Contract: POW5Contract;
  pow5InterestFarmContract: POW5InterestFarmContract;
  pow5LpNftStakeFarmContract: POW5LpNftStakeFarmContract;
  pow5LpSftLendFarmContract: POW5LpSftLendFarmContract;
  pow5PoolContract: UniswapV3PoolContract;
  pow5SwapperContract: UniV3SwapperContract;
  reverseRepoContract: ReverseRepoContract;
  usdcContract: ERC20Contract;
  wrappedNativeContract: WrappedNativeContract;
  yieldHarvestContract: YieldHarvestContract;
}

export { ContractLibrary };

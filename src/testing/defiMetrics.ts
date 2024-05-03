/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { USDC_DECIMALS } from "../utils/constants";

/*
 * Observed DeFi metrics used for testing semi-realistic scenarios
 */

//
// Price of USDC, in dollars
// Observed on 2024-04-01
//
const USDC_PRICE: number = 1.0; // $1

//
// Price of ETH, in dollars
// Observed on 2024-04-01: $3,452
// Observed on 2024-04-30: $3,010
//
const ETH_PRICE: number = 3010.0; // $3,010

//
// Total supply of UniV3-USDC/ETH pool on Base with TVL of $428.7M
// Observed on 2024-04-01
//
const USDC_ETH_LP_USDC_AMOUNT_BASE: bigint = ethers.parseUnits(
  "187000000",
  USDC_DECIMALS,
); // 187.0M
const USDC_ETH_LP_ETH_AMOUNT_BASE: bigint = ethers.parseEther("70100"); // 70.1K

export {
  ETH_PRICE,
  USDC_ETH_LP_ETH_AMOUNT_BASE,
  USDC_ETH_LP_USDC_AMOUNT_BASE,
  USDC_PRICE,
};

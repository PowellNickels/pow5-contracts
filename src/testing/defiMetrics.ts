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
// Observed on 2024-07-20: $3,498
//
const ETH_PRICE: number = 3498; // $3,498

//
// Total supply of USDC in UniV3-USDC/ETH pool on Base with TVL of
// Observed on 2024-04-01: 187,000,000 (TVL $428.7M)
// Observed on 2024-07-20: 8,276,359
//
const USDC_ETH_LP_USDC_AMOUNT_BASE: bigint = ethers.parseUnits(
  "8276359",
  USDC_DECIMALS,
); // 8,276,359

//
// Total supply of ETH in UniV3-USDC/ETH pool on Base with TVL of
// Observed on 2024-04-01: 70,100 (TVL $428.7M)
// Observed on 2024-07-20: 2,074
//
const USDC_ETH_LP_ETH_AMOUNT_BASE: bigint = ethers.parseEther("2074"); // 2,074

export {
  ETH_PRICE,
  USDC_ETH_LP_ETH_AMOUNT_BASE,
  USDC_ETH_LP_USDC_AMOUNT_BASE,
  USDC_PRICE,
};

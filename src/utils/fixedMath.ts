/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * This file is derived from the Uniswap V3 project after the BSL lapsed into
 * the GPL v2 license on 2023/04/01.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0 AND GPL-2.0-or-later
 * See the file LICENSE.txt for more information.
 */

import BigNumber from "bignumber.js";

// Setup bignuber.js
BigNumber.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

function decodeX128Int(x128Int: bigint): bigint {
  return x128Int / (2n ^ 128n);
}

/**
 * @description Returns the sqrt price as a 64x96
 */
function encodePriceSqrt(reserve1: bigint, reserve0: bigint): bigint {
  return BigInt(
    new BigNumber(reserve1.toString())
      .div(reserve0.toString())
      .sqrt()
      .multipliedBy(new BigNumber(2).pow(96))
      .integerValue(3)
      .toString(),
  );
}

export { decodeX128Int, encodePriceSqrt };

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

import { WrappedNativeContract } from "../contracts/token/erc20/wrappedNativeContract";
import { ERC20Contract } from "../contracts/zeppelin/token/erc20/erc20Contract";

/**
 * @description Contract library interface
 */
interface ContractLibrary {
  usdcContract: ERC20Contract;
  wrappedNativeContract: WrappedNativeContract;
}

export { ContractLibrary };

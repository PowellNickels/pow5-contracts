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

import { ethers } from "ethers";

/**
 * @description Contract library interface
 */
interface ContractLibrary {
  testErc1155EnumerableContract: ethers.Contract;
  testLiquidityMathContract: ethers.Contract;
  testTickMathContract: ethers.Contract;
  uniswapV3FactoryContract: ethers.Contract;
  uniswapV3NftDescriptorContract: ethers.Contract;
  uniswapV3NftManagerContract: ethers.Contract;
  uniswapV3StakerContract: ethers.Contract;
  usdcTokenContract: ethers.Contract;
  wrappedNativeTokenContract: ethers.Contract;
  wrappedNativeUsdcPoolContract: ethers.Contract;
  wrappedNativeUsdcPoolFactoryContract: ethers.Contract;
}

export { ContractLibrary };

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
 * @description Contract library interface using ethers.js version 6
 */
interface ContractLibraryEthers {
  lpPow1TokenContract: ethers.Contract;
  lpPow5TokenContract: ethers.Contract;
  lpSftContract: ethers.Contract;
  noLpSftContract: ethers.Contract;
  noPow5TokenContract: ethers.Contract;
  pow1PoolContract: ethers.Contract;
  pow1PoolerContract: ethers.Contract;
  pow1PoolFactoryContract: ethers.Contract;
  pow1StakerContract: ethers.Contract;
  pow1SwapperContract: ethers.Contract;
  pow1TokenContract: ethers.Contract;
  pow5PoolContract: ethers.Contract;
  pow5PoolerContract: ethers.Contract;
  pow5PoolFactoryContract: ethers.Contract;
  pow5StakerContract: ethers.Contract;
  pow5SwapperContract: ethers.Contract;
  pow5TokenContract: ethers.Contract;
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

export { ContractLibraryEthers };

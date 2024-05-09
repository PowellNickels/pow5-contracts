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

// Contract ABIs and artifacts (sort by path)
import usdcTokenAbi from "../../abi/contracts/test/token/erc20/USDC.sol/USDC.json";
import testErc1155EnumerableAbi from "../../abi/contracts/test/token/erc1155/extensions/TestERC1155Enumerable.sol/TestERC1155Enumerable.json";
import testLiquidityMathAbi from "../../abi/contracts/test/utils/math/TestLiquidityMath.sol/TestLiquidityMath.json";
import testTickMathAbi from "../../abi/contracts/test/utils/math/TestTickMath.sol/TestTickMath.json";

// Contract names (sort by constant)
const TEST_ERC1155_ENUMERABLE_CONTRACT: string = "TestERC1155Enumerable";
const TEST_LIQUIDITY_MATH_CONTRACT: string = "TestLiquidityMath";
const TEST_TICK_MATH_CONTRACT: string = "TestTickMath";
const USDC_CONTRACT: string = "USDC";

export {
  testErc1155EnumerableAbi,
  testLiquidityMathAbi,
  testTickMathAbi,
  usdcTokenAbi,
  TEST_ERC1155_ENUMERABLE_CONTRACT,
  TEST_LIQUIDITY_MATH_CONTRACT,
  TEST_TICK_MATH_CONTRACT,
  USDC_CONTRACT,
};

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

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";

import {
  TEST_ERC1155_ENUMERABLE_CONTRACT,
  TEST_LIQUIDITY_MATH_CONTRACT,
  TEST_REWARD_MATH_CONTRACT,
  TEST_STRING_UTILS_CONTRACT,
  TEST_TICK_MATH_CONTRACT,
} from "../src/hardhat/contracts/testing";

//
// Deploy test contracts
//

const func: DeployFunction = async (hardhat_re: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hardhat_re;
  const { deployer } = await getNamedAccounts();

  const opts: DeployOptions = {
    deterministicDeployment: true,
    from: deployer,
    log: true,
  };

  //
  // Deploy TestERC1155Enumerable
  //

  console.log(`Deploying ${TEST_ERC1155_ENUMERABLE_CONTRACT}`);
  await deployments.deploy(TEST_ERC1155_ENUMERABLE_CONTRACT, opts);

  //
  // Deploy TestLiquidityMath
  //

  console.log(`Deploying ${TEST_LIQUIDITY_MATH_CONTRACT}`);
  await deployments.deploy(TEST_LIQUIDITY_MATH_CONTRACT, opts);

  //
  // Deploy TestTickMath
  //

  console.log(`Deploying ${TEST_TICK_MATH_CONTRACT}`);
  await deployments.deploy(TEST_TICK_MATH_CONTRACT, opts);

  //
  // Deploy TestRewardMath
  //

  console.log(`Deploying ${TEST_REWARD_MATH_CONTRACT}`);
  await deployments.deploy(TEST_REWARD_MATH_CONTRACT, opts);

  //
  // Deploy TestStringUtils
  //

  console.log(`Deploying ${TEST_STRING_UTILS_CONTRACT}`);
  await deployments.deploy(TEST_STRING_UTILS_CONTRACT, opts);
};

export default func;
func.tags = ["Tests"];

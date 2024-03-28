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

import fs from "fs";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

//
// Create .chainId, needed for hardhat-deploy
//

const func: DeployFunction = async (hardhat_re: HardhatRuntimeEnvironment) => {
  // Get the network name
  const networkName: string = hardhat_re.network.name;

  // Get the chain ID
  const chainId: string = await hardhat_re.getChainId();

  //////////////////////////////////////////////////////////////////////////////
  // Record Chain ID
  //////////////////////////////////////////////////////////////////////////////

  // Created directory if it doesn't exist
  const deploymentDir = `${__dirname}/../deployments/${networkName}`;
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  // Create .chainId if it doesn't exist
  const chainIdFile = `${__dirname}/../deployments/${networkName}/.chainId`;
  if (!fs.existsSync(chainIdFile)) {
    fs.writeFileSync(chainIdFile, chainId);
  }

  // Log chain name and ID
  console.log(
    `Deploying contracts on the ${networkName} network with ID ${chainId}`,
  );
};

export default func;
func.tags = ["ChainID"];

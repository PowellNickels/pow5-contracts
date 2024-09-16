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

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction, DeployOptions } from "hardhat-deploy/types";
import { getUnnamedSigners } from "hardhat-deploy-ethers/dist/src/helpers";

import {
  NFT_DESCRIPTOR_CONTRACT,
  UNISWAP_V3_FACTORY_CONTRACT,
  UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
  UNISWAP_V3_NFT_MANAGER_CONTRACT,
  UNISWAP_V3_STAKER_CONTRACT,
  uniswapV3NftDescriptorAbi,
  wrappedNativeTokenAbi,
} from "../src/hardhat/contracts/depends";
import { getAddressBook, writeAddress } from "../src/hardhat/getAddressBook";
import { AddressBook } from "../src/interfaces/addressBook";

//
// Deploy the Uniswap V3 environment
//

const func: DeployFunction = async (hardhat_re: HardhatRuntimeEnvironment) => {
  const { deployments, ethers } = hardhat_re;

  // Get the deployer signer
  const signers: SignerWithAddress[] = await getUnnamedSigners(hardhat_re);
  const deployer: SignerWithAddress = signers[0];
  const deployerAddress: string = await deployer.getAddress();

  const opts: DeployOptions = {
    deterministicDeployment: true,
    from: deployerAddress,
    log: true,
  };

  // Get the network name
  const networkName: string = hardhat_re.network.name;

  // Get the contract addresses
  const addressBook: AddressBook = await getAddressBook(networkName);

  //////////////////////////////////////////////////////////////////////////////
  // Read W-ETH token symbol
  //////////////////////////////////////////////////////////////////////////////

  // Read W-ETH token symbol
  const wrappedNativeTokenContract = new ethers.Contract(
    addressBook.wrappedNativeToken!,
    wrappedNativeTokenAbi,
    deployer,
  );
  const wrappedNativeTokenSymbol: string =
    await wrappedNativeTokenContract.symbol();

  //////////////////////////////////////////////////////////////////////////////
  // Deploy contracts
  //////////////////////////////////////////////////////////////////////////////

  //
  // Deploy UniswapV3Factory
  //

  if (addressBook.uniswapV3Factory) {
    console.log(
      `Using ${UNISWAP_V3_FACTORY_CONTRACT} at ${addressBook.uniswapV3Factory}`,
    );
  } else {
    console.log(`Deploying ${UNISWAP_V3_FACTORY_CONTRACT}`);
    const tx = await deployments.deploy(UNISWAP_V3_FACTORY_CONTRACT, {
      ...opts,
      args: [deployerAddress],
    });
    addressBook.uniswapV3Factory = tx.address;
  }

  //
  // Deploy NonfungibleTokenPositionDescriptor
  //
  // TODO: This contract must be deployed with the ethers contract factory
  // because it requires a library, and as a result deployment files are
  // not generated. This is a known issue with hardhat-deploy.
  //
  // Additionally the contract is always deployed on the hardhat network
  // because it saves its address during deployment, and future deployments
  // use the saved address.
  //

  if (addressBook.uniswapV3NftDescriptor && networkName !== "hardhat") {
    console.log(
      `Using ${UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT} at ${addressBook.uniswapV3NftDescriptor}`,
    );
  } else {
    // Deploy NFTDescriptor
    console.log(`Deploying ${NFT_DESCRIPTOR_CONTRACT}`);
    const NFTDescriptor = await ethers.getContractFactory(
      NFT_DESCRIPTOR_CONTRACT,
      opts,
    );
    const nftDescriptor = await NFTDescriptor.deploy();
    const nftDescriptorAddress = await nftDescriptor.getAddress();

    // Deploy NonfungibleTokenPositionDescriptor
    console.log(`Deploying ${UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT}`);
    const UniswapV3NftDescriptor = await ethers.getContractFactory(
      UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
      {
        ...opts,
        libraries: {
          NFTDescriptor: nftDescriptorAddress,
        },
      },
    );
    const uniswapV3NftDescriptor = await UniswapV3NftDescriptor.deploy(
      addressBook.wrappedNativeToken!, // WETH9
      ethers.encodeBytes32String(wrappedNativeTokenSymbol), // nativeCurrencyLabelBytes
    );
    addressBook.uniswapV3NftDescriptor =
      await uniswapV3NftDescriptor.getAddress();
  }

  // Mine the next block to commit contractfactory deployment
  await hardhat_re.network.provider.request({
    method: "evm_mine",
    params: [],
  });

  //
  // Deploy NonfungiblePositionManager
  //

  if (addressBook.uniswapV3NftManager) {
    console.log(
      `Using ${UNISWAP_V3_NFT_MANAGER_CONTRACT} at ${addressBook.uniswapV3NftManager}`,
    );
  } else {
    console.log(`Deploying ${UNISWAP_V3_NFT_MANAGER_CONTRACT}`);
    const tx = await deployments.deploy(UNISWAP_V3_NFT_MANAGER_CONTRACT, {
      ...opts,
      args: [
        addressBook.uniswapV3Factory,
        addressBook.wrappedNativeToken,
        addressBook.uniswapV3NftDescriptor,
      ],
    });
    addressBook.uniswapV3NftManager = tx.address;
  }

  //
  // Deploy UniswapV3Staker
  //

  if (addressBook.uniswapV3Staker) {
    console.log(
      `Using ${UNISWAP_V3_STAKER_CONTRACT} at ${addressBook.uniswapV3Staker}`,
    );
  } else {
    console.log(`Deploying ${UNISWAP_V3_STAKER_CONTRACT}`);
    const tx = await deployments.deploy(UNISWAP_V3_STAKER_CONTRACT, {
      ...opts,
      args: [
        addressBook.uniswapV3Factory,
        addressBook.uniswapV3NftManager,
        0, // maxIncentiveStartLeadTime
        ethers.MaxUint256, // maxIncentiveDuration
      ],
    });
    addressBook.uniswapV3Staker = tx.address;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Record addresses
  //////////////////////////////////////////////////////////////////////////////

  writeAddress(
    networkName,
    UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
    addressBook.uniswapV3NftDescriptor!,
    uniswapV3NftDescriptorAbi,
  );
};

export default func;
func.tags = ["UniswapV3"];

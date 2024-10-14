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
import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeploymentsExtension } from "hardhat-deploy/types";
import { getUnnamedSigners } from "hardhat-deploy-ethers/dist/src/helpers";

import { ContractLibraryEthers } from "../hardhat/contractLibraryEthers";
import {
  defiManagerAbi,
  dutchAuctionAbi,
  erc20InterestFarmAbi,
  gameTokenPoolerAbi,
  gameTokenSwapperAbi,
  liquidityForgeAbi,
  lpNftStakeFarmAbi,
  lpPow1TokenAbi,
  lpPow5TokenAbi,
  lpSftAbi,
  lpSftLendFarmAbi,
  marketStableSwapperAbi,
  noLpSftAbi,
  noPow5TokenAbi,
  pow1TokenAbi,
  pow5TokenAbi,
  reverseRepoAbi,
  uniV3PoolFactoryAbi,
  uniV3StakeFarmAbi,
  yieldHarvestAbi,
} from "../hardhat/contracts/dapp";
import {
  uniswapV3FactoryAbi,
  uniswapV3NftDescriptorAbi,
  uniswapV3NftManagerAbi,
  uniswapV3PoolAbi,
  uniswapV3StakerAbi,
  wrappedNativeTokenAbi,
} from "../hardhat/contracts/depends";
import {
  testErc1155EnumerableAbi,
  testLiquidityMathAbi,
  testRewardMathAbi,
  testTickMathAbi,
  usdcTokenAbi,
} from "../hardhat/contracts/testing";
import { getAddressBook } from "../hardhat/getAddressBook";
import { getNetworkName } from "../hardhat/hardhatUtils";
import { AddressBook } from "../interfaces/addressBook";

//
// Fixture setup
//

async function setupFixture(
  hardhat_re: HardhatRuntimeEnvironment,
): Promise<ContractLibraryEthers> {
  // Ensure we start from a fresh deployment
  const deployments: DeploymentsExtension = hardhat_re.deployments;
  await deployments.fixture();

  // Get the beneficiary signer
  const signers: SignerWithAddress[] = await getUnnamedSigners(hardhat_re);
  const beneficiary: SignerWithAddress = signers[1];

  // Get the network name
  const networkName: string = getNetworkName();

  // Load contract addresses
  const addressBook: AddressBook = await getAddressBook(networkName);

  // Construct the contracts for beneficiary wallet
  const defiManagerContract = new ethers.Contract(
    addressBook.defiManager!,
    defiManagerAbi,
    beneficiary,
  );
  const dutchAuctionContract = new ethers.Contract(
    addressBook.dutchAuction!,
    dutchAuctionAbi,
    beneficiary,
  );
  const liquidityForgeContract = new ethers.Contract(
    addressBook.liquidityForge!,
    liquidityForgeAbi,
    beneficiary,
  );
  const lpPow1TokenContract = new ethers.Contract(
    addressBook.lpPow1Token!,
    lpPow1TokenAbi,
    beneficiary,
  );
  const lpPow5TokenContract = new ethers.Contract(
    addressBook.lpPow5Token!,
    lpPow5TokenAbi,
    beneficiary,
  );
  const lpSftContract = new ethers.Contract(
    addressBook.lpSft!,
    lpSftAbi,
    beneficiary,
  );
  const noLpSftContract = new ethers.Contract(
    addressBook.noLpSft!,
    noLpSftAbi,
    beneficiary,
  );
  const noPow5TokenContract = new ethers.Contract(
    addressBook.noPow5Token!,
    noPow5TokenAbi,
    beneficiary,
  );
  const pow1LpNftStakeFarmContract = new ethers.Contract(
    addressBook.pow1LpNftStakeFarm!,
    lpNftStakeFarmAbi,
    beneficiary,
  );
  const pow1LpSftLendFarmContract = new ethers.Contract(
    addressBook.pow1LpSftLendFarm!,
    lpSftLendFarmAbi,
    beneficiary,
  );
  const pow1MarketPoolContract = new ethers.Contract(
    addressBook.pow1MarketPool!,
    uniswapV3PoolAbi,
    beneficiary,
  );
  const pow1MarketPoolerContract = new ethers.Contract(
    addressBook.pow1MarketPooler!,
    gameTokenPoolerAbi,
    beneficiary,
  );
  const pow1MarketPoolFactoryContract = new ethers.Contract(
    addressBook.pow1MarketPoolFactory!,
    uniV3PoolFactoryAbi,
    beneficiary,
  );
  const pow1MarketSwapperContract = new ethers.Contract(
    addressBook.pow1MarketSwapper!,
    gameTokenSwapperAbi,
    beneficiary,
  );
  const pow1TokenContract = new ethers.Contract(
    addressBook.pow1Token!,
    pow1TokenAbi,
    beneficiary,
  );
  const pow5InterestFarmContract = new ethers.Contract(
    addressBook.pow5InterestFarm!,
    erc20InterestFarmAbi,
    beneficiary,
  );
  const pow5LpNftStakeFarmContract = new ethers.Contract(
    addressBook.pow5LpNftStakeFarm!,
    uniV3StakeFarmAbi,
    beneficiary,
  );
  const pow5LpSftLendFarmContract = new ethers.Contract(
    addressBook.pow5LpSftLendFarm!,
    lpSftLendFarmAbi,
    beneficiary,
  );
  const pow5StablePoolContract = new ethers.Contract(
    addressBook.pow5StablePool!,
    uniswapV3PoolAbi,
    beneficiary,
  );
  const pow5StablePoolerContract = new ethers.Contract(
    addressBook.pow5StablePooler!,
    gameTokenPoolerAbi,
    beneficiary,
  );
  const pow5StablePoolFactoryContract = new ethers.Contract(
    addressBook.pow5StablePoolFactory!,
    uniV3PoolFactoryAbi,
    beneficiary,
  );
  const pow5StableSwapperContract = new ethers.Contract(
    addressBook.pow5StableSwapper!,
    gameTokenSwapperAbi,
    beneficiary,
  );
  const pow5TokenContract = new ethers.Contract(
    addressBook.pow5Token!,
    pow5TokenAbi,
    beneficiary,
  );
  const reverseRepoContract = new ethers.Contract(
    addressBook.reverseRepo!,
    reverseRepoAbi,
    beneficiary,
  );
  const testErc1155EnumerableContract = new ethers.Contract(
    addressBook.testErc1155Enumerable!,
    testErc1155EnumerableAbi,
    beneficiary,
  );
  const testLiquidityMathContract = new ethers.Contract(
    addressBook.testLiquidityMath!,
    testLiquidityMathAbi,
    beneficiary,
  );
  const testRewardMathContract = new ethers.Contract(
    addressBook.testRewardMath!,
    testRewardMathAbi,
    beneficiary,
  );
  const testTickMathContract = new ethers.Contract(
    addressBook.testTickMath!,
    testTickMathAbi,
    beneficiary,
  );
  const uniswapV3FactoryContract = new ethers.Contract(
    addressBook.uniswapV3Factory!,
    uniswapV3FactoryAbi,
    beneficiary,
  );
  const uniswapV3NftDescriptorContract = new ethers.Contract(
    addressBook.uniswapV3NftDescriptor!,
    uniswapV3NftDescriptorAbi,
    beneficiary,
  );
  const uniswapV3NftManagerContract = new ethers.Contract(
    addressBook.uniswapV3NftManager!,
    uniswapV3NftManagerAbi,
    beneficiary,
  );
  const uniswapV3StakerContract = new ethers.Contract(
    addressBook.uniswapV3Staker!,
    uniswapV3StakerAbi,
    beneficiary,
  );
  const usdcTokenContract = new ethers.Contract(
    addressBook.usdcToken!,
    usdcTokenAbi,
    beneficiary,
  );
  const wrappedNativeTokenContract = new ethers.Contract(
    addressBook.wrappedNativeToken!,
    wrappedNativeTokenAbi,
    beneficiary,
  );
  const wrappedNativeUsdcPoolContract = new ethers.Contract(
    addressBook.wrappedNativeUsdcPool!,
    uniswapV3PoolAbi,
    beneficiary,
  );
  const wrappedNativeUsdcPoolFactoryContract = new ethers.Contract(
    addressBook.wrappedNativeUsdcPoolFactory!,
    uniV3PoolFactoryAbi,
    beneficiary,
  );
  const wrappedNativeUsdcSwapperContract = new ethers.Contract(
    addressBook.wrappedNativeUsdcSwapper!,
    marketStableSwapperAbi,
    beneficiary,
  );
  const yieldHarvestContract = new ethers.Contract(
    addressBook.yieldHarvest!,
    yieldHarvestAbi,
    beneficiary,
  );

  return {
    defiManagerContract,
    dutchAuctionContract,
    liquidityForgeContract,
    lpPow1TokenContract,
    lpPow5TokenContract,
    lpSftContract,
    noLpSftContract,
    noPow5TokenContract,
    pow1LpNftStakeFarmContract,
    pow1LpSftLendFarmContract,
    pow1MarketPoolContract,
    pow1MarketPoolerContract,
    pow1MarketPoolFactoryContract,
    pow1MarketSwapperContract,
    pow1TokenContract,
    pow5InterestFarmContract,
    pow5LpNftStakeFarmContract,
    pow5LpSftLendFarmContract,
    pow5StablePoolContract,
    pow5StablePoolerContract,
    pow5StablePoolFactoryContract,
    pow5StableSwapperContract,
    pow5TokenContract,
    reverseRepoContract,
    testErc1155EnumerableContract,
    testLiquidityMathContract,
    testRewardMathContract,
    testTickMathContract,
    uniswapV3FactoryContract,
    uniswapV3NftDescriptorContract,
    uniswapV3NftManagerContract,
    uniswapV3StakerContract,
    usdcTokenContract,
    wrappedNativeTokenContract,
    wrappedNativeUsdcPoolContract,
    wrappedNativeUsdcPoolFactoryContract,
    wrappedNativeUsdcSwapperContract,
    yieldHarvestContract,
  };
}

export { setupFixture };

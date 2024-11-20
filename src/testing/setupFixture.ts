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
} from "../abi/dapp";
import {
  uniswapV3FactoryAbi,
  uniswapV3NftDescriptorAbi,
  uniswapV3NftManagerAbi,
  uniswapV3PoolAbi,
  uniswapV3StakerAbi,
  wrappedNativeTokenAbi,
} from "../abi/depends";
import {
  testErc1155EnumerableAbi,
  testLiquidityMathAbi,
  testRewardMathAbi,
  testTickMathAbi,
  usdcTokenAbi,
} from "../abi/testing";
import { ContractLibraryEthers } from "../hardhat/contractLibraryEthers";
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
  const signers: SignerWithAddress[] = await hardhat_re.ethers.getSigners();
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
  const pow1TokenContract = await hardhat_re.ethers.getContractAt(
    pow1TokenAbi,
    addressBook.pow1Token!,
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
  const pow5TokenContract = await hardhat_re.ethers.getContractAt(
    pow5TokenAbi,
    addressBook.pow5Token!,
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
  const testLiquidityMathContract = await hardhat_re.ethers.getContractAt(
    testLiquidityMathAbi,
    addressBook.testLiquidityMath!,
    beneficiary,
  );
  const testRewardMathContract = await hardhat_re.ethers.getContractAt(
    testRewardMathAbi,
    addressBook.testRewardMath!,
    beneficiary,
  );
  const testTickMathContract = await hardhat_re.ethers.getContractAt(
    testTickMathAbi,
    addressBook.testTickMath!,
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
  const uniswapV3NftManagerContract = await hardhat_re.ethers.getContractAt(
    uniswapV3NftManagerAbi,
    addressBook.uniswapV3NftManager!,
    beneficiary,
  );
  const uniswapV3StakerContract = new ethers.Contract(
    addressBook.uniswapV3Staker!,
    uniswapV3StakerAbi,
    beneficiary,
  );
  const usdcTokenContract = await hardhat_re.ethers.getContractAt(
    usdcTokenAbi,
    addressBook.usdcToken!,
    beneficiary,
  );
  const wrappedNativeTokenContract = await hardhat_re.ethers.getContractAt(
    wrappedNativeTokenAbi,
    addressBook.wrappedNativeToken!,
    beneficiary,
  );
  const wrappedNativeUsdcPoolContract = await hardhat_re.ethers.getContractAt(
    uniswapV3PoolAbi,
    addressBook.wrappedNativeUsdcPool!,
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
    wrappedNativeUsdcSwapperContract,
    yieldHarvestContract,
  };
}

export { setupFixture };

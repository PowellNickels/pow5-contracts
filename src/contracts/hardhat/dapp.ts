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
import dutchAuctionAbi from "../../abi/contracts/src/bureaus/DutchAuction.sol/DutchAuction.json";
import liquidityForgeAbi from "../../abi/contracts/src/bureaus/LiquidityForge.sol/LiquidityForge.json";
import reverseRepoAbi from "../../abi/contracts/src/bureaus/ReverseRepo.sol/ReverseRepo.json";
import yieldHarvestAbi from "../../abi/contracts/src/bureaus/YieldHarvest.sol/YieldHarvest.json";
import defiManagerAbi from "../../abi/contracts/src/defi/DeFiManager.sol/DeFiManager.json";
import erc20InterestFarmAbi from "../../abi/contracts/src/defi/ERC20InterestFarm.sol/ERC20InterestFarm.json";
import lpNftStakeFarmAbi from "../../abi/contracts/src/defi/LPNFTStakeFarm.sol/LPNFTStakeFarm.json";
import lpSftLendFarmAbi from "../../abi/contracts/src/defi/LPSFTLendFarm.sol/LPSFTLendFarm.json";
import uniV3StakeFarmAbi from "../../abi/contracts/src/defi/UniV3StakeFarm.sol/UniV3StakeFarm.json";
import lpPow1TokenAbi from "../../abi/contracts/src/token/ERC20/LPPOW1.sol/LPPOW1.json";
import lpPow5TokenAbi from "../../abi/contracts/src/token/ERC20/LPPOW5.sol/LPPOW5.json";
import noPow5TokenAbi from "../../abi/contracts/src/token/ERC20/NOPOW5.sol/NOPOW5.json";
import pow1TokenAbi from "../../abi/contracts/src/token/ERC20/POW1.sol/POW1.json";
import pow5TokenAbi from "../../abi/contracts/src/token/ERC20/POW5.sol/POW5.json";
import lpNftAbi from "../../abi/contracts/src/token/ERC1155/LPNFT.sol/LPNFT.json";
import lpSftAbi from "../../abi/contracts/src/token/ERC1155/LPSFT.sol/LPSFT.json";
import noLpSftAbi from "../../abi/contracts/src/token/ERC1155/NOLPSFT.sol/NOLPSFT.json";
import uniV3PoolerAbi from "../../abi/contracts/src/token/routes/UniV3Pooler.sol/UniV3Pooler.json";
import uniV3StakerAbi from "../../abi/contracts/src/token/routes/UniV3Staker.sol/UniV3Staker.json";
import uniV3SwapperAbi from "../../abi/contracts/src/token/routes/UniV3Swapper.sol/UniV3Swapper.json";
import uniV3PoolFactoryAbi from "../../abi/contracts/src/utils/helpers/UniV3PoolFactory.sol/UniV3PoolFactory.json";

// Contract names (sort by constant)
const DEFI_MANAGER_CONTRACT: string = "DeFiManager";
const DUTCH_AUCTION_CONTRACT: string = "DutchAuction";
const ERC20_INTEREST_FARM_CONTRACT: string = "ERC20InterestFarm";
const LIQUIDITY_FORGE_CONTRACT: string = "LiquidityForge";
const LPNFT_CONTRACT: string = "LPNFT";
const LPNFT_STAKE_FARM_CONTRACT: string = "LPNFTStakeFarm";
const LPPOW1_TOKEN_CONTRACT: string = "LPPOW1";
const LPPOW5_TOKEN_CONTRACT: string = "LPPOW5";
const LPSFT_CONTRACT: string = "LPSFT";
const LPSFT_LEND_FARM_CONTRACT: string = "LPSFTLendFarm";
const NOLPSFT_CONTRACT: string = "NOLPSFT";
const NOPOW5_TOKEN_CONTRACT = "NOPOW5";
const POW1_TOKEN_CONTRACT: string = "POW1";
const POW5_TOKEN_CONTRACT: string = "POW5";
const REVERSE_REPO_CONTRACT: string = "ReverseRepo";
const UNI_V3_POOL_FACTORY_CONTRACT: string = "UniV3PoolFactory";
const UNI_V3_POOLER_CONTRACT: string = "UniV3Pooler";
const UNI_V3_STAKER_CONTRACT: string = "UniV3Staker";
const UNI_V3_SWAPPER_CONTRACT: string = "UniV3Swapper";
const UNIV3_STAKE_FARM_CONTRACT: string = "UniV3StakeFarm";
const YIELD_HARVEST_CONTRACT: string = "YieldHarvest";

// Deployed contract aliases (sort by constant)
const POW1_LPNFT_STAKE_FARM_CONTRACT: string = "POW1LpNftStakeFarm";
const POW1_LPSFT_LEND_FARM_CONTRACT: string = "LPPOW1SftLendFarm";
const POW1_POOL_CONTRACT: string = "POW1Pool";
const POW1_POOL_FACTORY_CONTRACT: string = "POW1PoolFactory";
const POW1_POOLER_CONTRACT: string = "POW1Pooler";
const POW1_STAKER_CONTRACT: string = "POW1Staker";
const POW1_SWAPPER_CONTRACT: string = "POW1Swapper";
const POW5_INTEREST_FARM_CONTRACT: string = "POW5InterestFarm";
const POW5_LPNFT_STAKE_FARM_CONTRACT: string = "POW5LpNftStakeFarm";
const POW5_POOL_CONTRACT: string = "POW5Pool";
const POW5_POOL_FACTORY_CONTRACT: string = "POW5PoolFactory";
const POW5_POOLER_CONTRACT: string = "POW5Pooler";
const POW5_STAKER_CONTRACT: string = "POW5Staker";
const POW5_SWAPPER_CONTRACT: string = "POW5Swapper";

export {
  defiManagerAbi,
  dutchAuctionAbi,
  erc20InterestFarmAbi,
  liquidityForgeAbi,
  lpNftAbi,
  lpNftStakeFarmAbi,
  lpPow1TokenAbi,
  lpPow5TokenAbi,
  lpSftAbi,
  lpSftLendFarmAbi,
  noLpSftAbi,
  noPow5TokenAbi,
  pow1TokenAbi,
  pow5TokenAbi,
  reverseRepoAbi,
  uniV3PoolerAbi,
  uniV3PoolFactoryAbi,
  uniV3StakeFarmAbi,
  uniV3StakerAbi,
  uniV3SwapperAbi,
  yieldHarvestAbi,
  DEFI_MANAGER_CONTRACT,
  DUTCH_AUCTION_CONTRACT,
  ERC20_INTEREST_FARM_CONTRACT,
  LIQUIDITY_FORGE_CONTRACT,
  LPNFT_CONTRACT,
  LPNFT_STAKE_FARM_CONTRACT,
  LPPOW1_TOKEN_CONTRACT,
  LPPOW5_TOKEN_CONTRACT,
  LPSFT_CONTRACT,
  LPSFT_LEND_FARM_CONTRACT,
  NOLPSFT_CONTRACT,
  NOPOW5_TOKEN_CONTRACT,
  POW1_LPNFT_STAKE_FARM_CONTRACT,
  POW1_LPSFT_LEND_FARM_CONTRACT,
  POW1_POOL_CONTRACT,
  POW1_POOL_FACTORY_CONTRACT,
  POW1_POOLER_CONTRACT,
  POW1_STAKER_CONTRACT,
  POW1_SWAPPER_CONTRACT,
  POW1_TOKEN_CONTRACT,
  POW5_INTEREST_FARM_CONTRACT,
  POW5_LPNFT_STAKE_FARM_CONTRACT,
  POW5_POOL_CONTRACT,
  POW5_POOL_FACTORY_CONTRACT,
  POW5_POOLER_CONTRACT,
  POW5_STAKER_CONTRACT,
  POW5_SWAPPER_CONTRACT,
  POW5_TOKEN_CONTRACT,
  REVERSE_REPO_CONTRACT,
  UNI_V3_POOL_FACTORY_CONTRACT,
  UNI_V3_POOLER_CONTRACT,
  UNI_V3_STAKER_CONTRACT,
  UNI_V3_SWAPPER_CONTRACT,
  UNIV3_STAKE_FARM_CONTRACT,
  YIELD_HARVEST_CONTRACT,
};

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
import dutchAuctionAbi from "../../abi/contracts/src/interfaces/bureaucracy/dutchAuction/IDutchAuction.sol/IDutchAuction.json";
import liquidityForgeAbi from "../../abi/contracts/src/interfaces/bureaucracy/ILiquidityForge.sol/ILiquidityForge.json";
import reverseRepoAbi from "../../abi/contracts/src/interfaces/bureaucracy/IReverseRepo.sol/IReverseRepo.json";
import yieldHarvestAbi from "../../abi/contracts/src/interfaces/bureaucracy/yieldHarvest/IYieldHarvest.sol/IYieldHarvest.json";
import defiManagerAbi from "../../abi/contracts/src/interfaces/defi/IDeFiManager.sol/IDeFiManager.json";
import erc20InterestFarmAbi from "../../abi/contracts/src/interfaces/defi/IERC20InterestFarm.sol/IERC20InterestFarm.json";
import lpNftStakeFarmAbi from "../../abi/contracts/src/interfaces/defi/ILPNFTStakeFarm.sol/ILPNFTStakeFarm.json";
import lpSftLendFarmAbi from "../../abi/contracts/src/interfaces/defi/ILPSFTLendFarm.sol/ILPSFTLendFarm.json";
import uniV3StakeFarmAbi from "../../abi/contracts/src/interfaces/defi/IUniV3StakeFarm.sol/IUniV3StakeFarm.json";
import lpNftAbi from "../../abi/contracts/src/interfaces/token/ERC1155/ILPNFT.sol/ILPNFT.json";
import lpSftAbi from "../../abi/contracts/src/interfaces/token/ERC1155/ILPSFT.sol/ILPSFT.json";
import noLpSftAbi from "../../abi/contracts/src/interfaces/token/ERC1155/INOLPSFT.sol/INOLPSFT.json";
import gameTokenPoolerAbi from "../../abi/contracts/src/interfaces/token/routes/IGameTokenPooler.sol/IGameTokenPooler.json";
import gameTokenSwapperAbi from "../../abi/contracts/src/interfaces/token/routes/IGameTokenSwapper.sol/IGameTokenSwapper.json";
import marketStableSwapperAbi from "../../abi/contracts/src/interfaces/token/routes/IMarketStableSwapper.sol/IMarketStableSwapper.json";
import lpPow1TokenAbi from "../../abi/contracts/src/token/ERC20/LPPOW1.sol/LPPOW1.json";
import lpPow5TokenAbi from "../../abi/contracts/src/token/ERC20/LPPOW5.sol/LPPOW5.json";
import noPow5TokenAbi from "../../abi/contracts/src/token/ERC20/NOPOW5.sol/NOPOW5.json";
import pow1TokenAbi from "../../abi/contracts/src/token/ERC20/POW1.sol/POW1.json";
import pow5TokenAbi from "../../abi/contracts/src/token/ERC20/POW5.sol/POW5.json";
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
const MARKET_STABLE_SWAPPER_CONTRACT: string = "MarketStableSwapper";
const NOLPSFT_CONTRACT: string = "NOLPSFT";
const NOPOW5_TOKEN_CONTRACT = "NOPOW5";
const POW1_MARKET_POOLER_CONTRACT: string = "POW1MarketPooler";
const POW1_MARKET_SWAPPER_CONTRACT: string = "POW1MarketSwapper";
const POW1_TOKEN_CONTRACT: string = "POW1";
const POW5_STABLE_POOLER_CONTRACT: string = "POW5StablePooler";
const POW5_SWAPPER_CONTRACT: string = "POW5StableSwapper";
const POW5_TOKEN_CONTRACT: string = "POW5";
const REVERSE_REPO_CONTRACT: string = "ReverseRepo";
const THE_RESERVE_CONTRACT: string = "TheReserve";
const UNI_V3_POOL_FACTORY_CONTRACT: string = "UniV3PoolFactory";
const UNIV3_STAKE_FARM_CONTRACT: string = "UniV3StakeFarm";
const YIELD_HARVEST_CONTRACT: string = "YieldHarvest";

// Deployed contract aliases (sort by constant)
const POW1_LPNFT_STAKE_FARM_CONTRACT: string = "POW1LpNftStakeFarm";
const POW1_LPSFT_LEND_FARM_CONTRACT: string = "POW1LpSftLendFarm";
const POW1_MARKET_POOL_CONTRACT: string = "POW1Pool";
const POW1_MARKET_POOL_FACTORY_CONTRACT: string = "POW1PoolFactory";
const POW5_INTEREST_FARM_CONTRACT: string = "POW5InterestFarm";
const POW5_LPNFT_STAKE_FARM_CONTRACT: string = "POW5LpNftStakeFarm";
const POW5_LPSFT_LEND_FARM_CONTRACT: string = "POW5LpSftLendFarm";
const POW5_STABLE_POOL_CONTRACT: string = "POW5Pool";
const POW5_STABLE_POOL_FACTORY_CONTRACT: string = "POW5PoolFactory";

export {
  defiManagerAbi,
  dutchAuctionAbi,
  erc20InterestFarmAbi,
  gameTokenPoolerAbi,
  gameTokenSwapperAbi,
  liquidityForgeAbi,
  lpNftAbi,
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
  MARKET_STABLE_SWAPPER_CONTRACT,
  NOLPSFT_CONTRACT,
  NOPOW5_TOKEN_CONTRACT,
  POW1_LPNFT_STAKE_FARM_CONTRACT,
  POW1_LPSFT_LEND_FARM_CONTRACT,
  POW1_MARKET_POOL_CONTRACT,
  POW1_MARKET_POOL_FACTORY_CONTRACT,
  POW1_MARKET_POOLER_CONTRACT,
  POW1_MARKET_SWAPPER_CONTRACT,
  POW1_TOKEN_CONTRACT,
  POW5_INTEREST_FARM_CONTRACT,
  POW5_LPNFT_STAKE_FARM_CONTRACT,
  POW5_LPSFT_LEND_FARM_CONTRACT,
  POW5_STABLE_POOL_CONTRACT,
  POW5_STABLE_POOL_FACTORY_CONTRACT,
  POW5_STABLE_POOLER_CONTRACT,
  POW5_SWAPPER_CONTRACT,
  POW5_TOKEN_CONTRACT,
  REVERSE_REPO_CONTRACT,
  THE_RESERVE_CONTRACT,
  UNI_V3_POOL_FACTORY_CONTRACT,
  UNIV3_STAKE_FARM_CONTRACT,
  YIELD_HARVEST_CONTRACT,
};

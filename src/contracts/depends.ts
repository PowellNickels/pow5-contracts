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
import erc20Abi from "../abi/@openzeppelin/contracts/token/ERC20/IERC20.sol/IERC20.json";
import wrappedNativeTokenAbi from "../abi/contracts/depends/canonical-weth/WETH9.sol/WETH9.json";
import uniswapV3FactoryAbi from "../abi/contracts/depends/uniswap-v3-core/UniswapV3Factory.sol/UniswapV3Factory.json";
import uniswapV3PoolAbi from "../abi/contracts/depends/uniswap-v3-core/UniswapV3Pool.sol/UniswapV3Pool.json";
import uniswapV3NftManagerAbi from "../abi/contracts/depends/uniswap-v3-periphery/NonfungiblePositionManager.sol/NonfungiblePositionManager.json";
import uniswapV3NftDescriptorAbi from "../abi/contracts/depends/uniswap-v3-periphery/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json";
import uniswapV3StakerAbi from "../abi/contracts/depends/uniswap-v3-staker/UniswapV3Staker.sol/UniswapV3Staker.json";

// Contract names (sort by constant)
const NFT_DESCRIPTOR_CONTRACT = "NFTDescriptor";
const UNISWAP_V3_FACTORY_CONTRACT = "UniswapV3Factory";
const UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT = "NonfungibleTokenPositionDescriptor";
const UNISWAP_V3_NFT_MANAGER_CONTRACT = "NonfungiblePositionManager";
const UNISWAP_V3_POOL_CONTRACT = "UniswapV3Pool";
const UNISWAP_V3_STAKER_CONTRACT = "UniswapV3Staker";
const WRAPPED_NATIVE_TOKEN_CONTRACT = "WETH";

// Deployed contract aliases
const WRAPPED_NATIVE_USDC_POOL_CONTRACT = "WrappedNativeUsdcPool";
const WRAPPED_NATIVE_USDC_POOL_FACTORY_CONTRACT =
  "WrappedNativeUsdcPoolFactory";

export {
  erc20Abi,
  uniswapV3FactoryAbi,
  uniswapV3NftDescriptorAbi,
  uniswapV3NftManagerAbi,
  uniswapV3PoolAbi,
  uniswapV3StakerAbi,
  wrappedNativeTokenAbi,
  NFT_DESCRIPTOR_CONTRACT,
  UNISWAP_V3_FACTORY_CONTRACT,
  UNISWAP_V3_NFT_DESCRIPTOR_CONTRACT,
  UNISWAP_V3_NFT_MANAGER_CONTRACT,
  UNISWAP_V3_POOL_CONTRACT,
  UNISWAP_V3_STAKER_CONTRACT,
  WRAPPED_NATIVE_TOKEN_CONTRACT,
  WRAPPED_NATIVE_USDC_POOL_CONTRACT,
  WRAPPED_NATIVE_USDC_POOL_FACTORY_CONTRACT,
};

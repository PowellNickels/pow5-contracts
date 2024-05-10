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
const LPNFT_CONTRACT: string = "LPNFT";
const LPPOW1_TOKEN_CONTRACT: string = "LPPOW1";
const LPPOW5_TOKEN_CONTRACT: string = "LPPOW5";
const LPSFT_CONTRACT: string = "LPSFT";
const NOLPSFT_CONTRACT: string = "NOLPSFT";
const NOPOW5_TOKEN_CONTRACT = "NOPOW5";
const POW1_TOKEN_CONTRACT: string = "POW1";
const POW5_TOKEN_CONTRACT: string = "POW5";
const UNI_V3_POOL_FACTORY_CONTRACT: string = "UniV3PoolFactory";
const UNI_V3_POOLER_CONTRACT: string = "UniV3Pooler";
const UNI_V3_STAKER_CONTRACT: string = "UniV3Staker";
const UNI_V3_SWAPPER_CONTRACT: string = "UniV3Swapper";

// Deployed contract aliases (sort by constant)
const POW1_POOL_CONTRACT: string = "POW1Pool";
const POW1_POOL_FACTORY_CONTRACT: string = "POW1PoolFactory";
const POW1_POOLER_CONTRACT: string = "POW1Pooler";
const POW1_STAKER_CONTRACT: string = "POW1Staker";
const POW1_SWAPPER_CONTRACT: string = "POW1Swapper";
const POW5_POOL_CONTRACT: string = "POW5Pool";
const POW5_POOL_FACTORY_CONTRACT: string = "POW5PoolFactory";
const POW5_POOLER_CONTRACT: string = "POW5Pooler";
const POW5_STAKER_CONTRACT: string = "POW5Staker";
const POW5_SWAPPER_CONTRACT: string = "POW5Swapper";

export {
  lpNftAbi,
  lpPow1TokenAbi,
  lpPow5TokenAbi,
  lpSftAbi,
  noLpSftAbi,
  noPow5TokenAbi,
  pow1TokenAbi,
  pow5TokenAbi,
  uniV3PoolerAbi,
  uniV3PoolFactoryAbi,
  uniV3StakerAbi,
  uniV3SwapperAbi,
  LPNFT_CONTRACT,
  LPPOW1_TOKEN_CONTRACT,
  LPPOW5_TOKEN_CONTRACT,
  LPSFT_CONTRACT,
  NOLPSFT_CONTRACT,
  NOPOW5_TOKEN_CONTRACT,
  POW1_POOL_CONTRACT,
  POW1_POOL_FACTORY_CONTRACT,
  POW1_POOLER_CONTRACT,
  POW1_STAKER_CONTRACT,
  POW1_SWAPPER_CONTRACT,
  POW1_TOKEN_CONTRACT,
  POW5_POOL_CONTRACT,
  POW5_POOL_FACTORY_CONTRACT,
  POW5_POOLER_CONTRACT,
  POW5_STAKER_CONTRACT,
  POW5_SWAPPER_CONTRACT,
  POW5_TOKEN_CONTRACT,
  UNI_V3_POOL_FACTORY_CONTRACT,
  UNI_V3_POOLER_CONTRACT,
  UNI_V3_STAKER_CONTRACT,
  UNI_V3_SWAPPER_CONTRACT,
};

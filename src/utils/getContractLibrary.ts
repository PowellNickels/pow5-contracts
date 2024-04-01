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

import { Signer } from "ethers";

import { DutchAuctionContract } from "../contracts/bureaus/dutchAuctionContract";
import { LiquidityForgeContract } from "../contracts/bureaus/liquidityForgeContract";
import { ReverseRepoContract } from "../contracts/bureaus/reverseRepoContract";
import { YieldHarvestContract } from "../contracts/bureaus/yieldHarvestContract";
import { DeFiManagerContract } from "../contracts/defi/defiManagerContract";
import { POW5InterestFarmContract } from "../contracts/defi/pow5InterestFarmContract";
import { LPPOW1Contract } from "../contracts/token/erc20/lpPow1Contract";
import { LPPOW5Contract } from "../contracts/token/erc20/lpPow5Contract";
import { NOPOW5Contract } from "../contracts/token/erc20/noPow5Contract";
import { POW1Contract } from "../contracts/token/erc20/pow1Contract";
import { POW5Contract } from "../contracts/token/erc20/pow5Contract";
import { WrappedNativeContract } from "../contracts/token/erc20/wrappedNativeContract";
import { LPSFTContract } from "../contracts/token/erc1155/lpSftContract";
import { NOLPSFTContract } from "../contracts/token/erc1155/noLpSftContract";
import { ERC20Contract } from "../contracts/zeppelin/token/erc20/erc20Contract";
import { AddressBook } from "../interfaces/addressBook";
import { ContractLibrary } from "../interfaces/contractLibrary";

//
// Utility functions
//

function getContractLibrary(
  signer: Signer,
  addressBook: AddressBook,
): ContractLibrary {
  return {
    defiManagerContract: new DeFiManagerContract(
      signer,
      addressBook.defiManager!,
    ),
    dutchAuctionContract: new DutchAuctionContract(
      signer,
      addressBook.dutchAuction!,
    ),
    liquidityForgeContract: new LiquidityForgeContract(
      signer,
      addressBook.liquidityForge!,
    ),
    lpPow1Contract: new LPPOW1Contract(signer, addressBook.lpPow1Token!),
    lpPow5Contract: new LPPOW5Contract(signer, addressBook.lpPow5Token!),
    lpSftContract: new LPSFTContract(signer, addressBook.lpSft!),
    noLpSftContract: new NOLPSFTContract(signer, addressBook.noLpSft!),
    noPow5Contract: new NOPOW5Contract(signer, addressBook.noPow5Token!),
    pow1Contract: new POW1Contract(signer, addressBook.pow1Token!),
    pow5Contract: new POW5Contract(signer, addressBook.pow5Token!),
    pow5InterestFarmContract: new POW5InterestFarmContract(
      signer,
      addressBook.pow5InterestFarm!,
    ),
    reverseRepoContract: new ReverseRepoContract(
      signer,
      addressBook.reverseRepo!,
    ),
    usdcContract: new ERC20Contract(signer, addressBook.usdcToken!),
    wrappedNativeContract: new WrappedNativeContract(
      signer,
      addressBook.wrappedNativeToken!,
    ),
    yieldHarvestContract: new YieldHarvestContract(
      signer,
      addressBook.yieldHarvest!,
    ),
  };
}

export { getContractLibrary };

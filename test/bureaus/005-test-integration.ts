/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

/* eslint @typescript-eslint/no-unused-vars: "off" */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { Contract, ContractTransactionResponse, ethers } from "ethers";
import * as hardhat from "hardhat";

import { DutchAuctionContract } from "../../src/contracts/bureaus/dutchAuctionContract";
import { LiquidityForgeContract } from "../../src/contracts/bureaus/liquidityForgeContract";
import { ReverseRepoContract } from "../../src/contracts/bureaus/reverseRepoContract";
import { YieldHarvestContract } from "../../src/contracts/bureaus/yieldHarvestContract";
import { LPPOW1Contract } from "../../src/contracts/token/erc20/lpPow1Contract";
import { LPPOW5Contract } from "../../src/contracts/token/erc20/lpPow5Contract";
import { NOPOW5Contract } from "../../src/contracts/token/erc20/noPow5Contract";
import { POW1Contract } from "../../src/contracts/token/erc20/pow1Contract";
import { POW5Contract } from "../../src/contracts/token/erc20/pow5Contract";
import { LPSFTContract } from "../../src/contracts/token/erc1155/lpSftContract";
import { ERC20Contract } from "../../src/contracts/zeppelin/token/erc20/erc20Contract";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { ETH_PRICE, USDC_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPPOW1_AMOUNT,
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_LPPOW5_AMOUNT,
  INITIAL_LPPOW5_USDC_VALUE,
  INITIAL_POW1_PRICE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_AMOUNT,
  INITIAL_POW5_DEPOSIT,
  INITIAL_POW5_PRICE,
  LPPOW1_DECIMALS,
  LPPOW5_DECIMALS,
  POW1_DECIMALS,
  POW5_DECIMALS,
  USDC_DECIMALS,
  ZERO_ADDRESS,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";
import { getAddressBook } from "../../src/utils/getAddressBook";
import { extractJSONFromURI } from "../../src/utils/lpNftUtils";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

// Initial amount of USDC to deposit into the Reverse Repo
const INITIAL_USDC_AMOUNT: bigint =
  ethers.parseUnits(INITIAL_LPPOW5_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

// POW1 test reward for LPPOW1 staking incentive
const LPPOW1_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// POW1 test reward for LPPOW5 staking incentive
const LPPOW5_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// Remaining dust balances after depositing into LP pool
const LPPOW5_POW5_DUST: bigint = 134_419n;
const LPPOW5_USDC_DUST: bigint = 0n;

// Token IDs of minted LP-NFTs
const LPPOW1_LPNFT_TOKEN_ID: bigint = 1n;
const LPPOW5_LPNFT_TOKEN_ID: bigint = 2n;
const PURCHASED_LPNFT_TOKEN_ID: bigint = 3n;

// Amount of USDC to deposit in the Reverse Repo
const PURCHASE_USDC_AMOUNT: bigint =
  ethers.parseUnits("1000", USDC_DECIMALS) / BigInt(USDC_PRICE); // 1,000 USDC ($1,000)

// Amount of LPPOW5 minted in the first sale
const PURCHASE_LPPOW5_AMOUNT: bigint = 32_597_676_069_972n; // 32 LPPOW5

// Returned USDC after buying
const PURCHASE_POW5_RETURNED: bigint = 9_681_047_111_497_358n; // 9.681 POW5

// USDC lost when a POW5 LP-SFT is purchased and then liquidated
const PURCHASE_USDC_LOST: bigint = 3_536_677n; // 3.536 USDC ($3.54)

//
// Debug parameters
//

// Debug option to print the LP-NFT's image data URI
const DEBUG_PRINT_LPNFT_IMAGE: boolean = false;

//
// Contracts used by this file
//

function createContractLibrary(
  signer: SignerWithAddress,
  addressBook: AddressBook,
): ContractLibrary {
  return {
    dutchAuctionContract: new DutchAuctionContract(signer, addressBook),
    liquidityForgeContract: new LiquidityForgeContract(signer, addressBook),
    lpPow1Contract: new LPPOW1Contract(signer, addressBook.lpPow1Token!),
    lpPow5Contract: new LPPOW5Contract(signer, addressBook.lpPow5Token!),
    lpSftContract: new LPSFTContract(signer, addressBook.lpSft!),
    noPow5Contract: new NOPOW5Contract(signer, addressBook.noPow5Token!),
    pow1Contract: new POW1Contract(signer, addressBook.pow1Token!),
    pow5Contract: new POW5Contract(signer, addressBook.pow5Token!),
    reverseRepoContract: new ReverseRepoContract(signer, addressBook),
    usdcContract: new ERC20Contract(signer, addressBook.usdcToken!),
    wrappedNativeContract: new ERC20Contract(
      signer,
      addressBook.wrappedNativeToken!,
    ),
    yieldHarvestContract: new YieldHarvestContract(signer, addressBook),
  };
}

//
// Test cases
//

describe("The Reserve integration test", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture Constants
  //////////////////////////////////////////////////////////////////////////////

  const ERC20_ISSUER_ROLE: string =
    ethers.encodeBytes32String("ERC20_ISSUER_ROLE");
  const ERC20_FARM_OPERATOR_ROLE: string = ethers.encodeBytes32String(
    "ERC20_FARM_OPERATOR_ROLE",
  );
  const LPSFT_ISSUER_ROLE: string =
    ethers.encodeBytes32String("LPSFT_ISSUER_ROLE");
  const DEFI_OPERATOR_ROLE: string =
    ethers.encodeBytes32String("DEFI_OPERATOR_ROLE");
  const LPSFT_FARM_OPERATOR_ROLE: string = ethers.encodeBytes32String(
    "LPSFT_FARM_OPERATOR_ROLE",
  );

  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let deployerContracts: ContractLibrary;
  let beneficiaryContracts: ContractLibrary;
  let addressBook: AddressBook;
  let pow1IsToken0: boolean;
  let pow5IsToken0: boolean;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use ethers to get the accounts
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];
    beneficiary = signers[1];

    // A single fixture is used for the test suite
    await setupTest();

    // Load address book
    addressBook = await getAddressBook(hardhat.network.name);

    // Set up contracts for accounts
    deployerContracts = await createContractLibrary(deployer, addressBook);
    beneficiaryContracts = await createContractLibrary(
      beneficiary,
      addressBook,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPPOW1 issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    /*
    const { lpPow1TokenContract, lpSftContract } = contracts;

    // Grant ERC-20 issuer role to LP-SFT
    const tx: ContractTransactionResponse = await (
      lpPow1TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await lpSftContract.getAddress());
    await tx.wait();
    */

    const { lpPow1Contract } = deployerContracts;

    // Grant LPPOW1 issuer role to LPSFT
    lpPow1Contract.grantRole(ERC20_ISSUER_ROLE, addressBook.lpSft!);
  });

  it("should grant LP-SFT minter role to LPPOW1 stake farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    /*
    const { lpSftContract, pow1LpNftStakeFarmContract } = contracts;

    // Grant LP-SFT minter role to LPPOW1 stake farm
    const tx: ContractTransactionResponse = await (
      lpSftContract.connect(deployer) as Contract
    ).grantRole(
      LPSFT_ISSUER_ROLE,
      await pow1LpNftStakeFarmContract.getAddress(),
    );
    await tx.wait();
    */
  });

  it("should get pool token order for LPPOW1", async function (): Promise<void> {
    /*
    const { pow1PoolerContract } = contracts;

    // Get pool token order
    pow1IsToken0 = await pow1PoolerContract.gameIsToken0();
    chai.expect(pow1IsToken0).to.be.a("boolean");
    */
  });

  it("should initialize the LPPOW1 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    /*
    const { pow1PoolContract } = contracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow1IsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_POW1_SUPPLY,
      pow1IsToken0 ? INITIAL_POW1_SUPPLY : INITIAL_WETH_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const tx: ContractTransactionResponse =
      await pow1PoolContract.initialize(INITIAL_PRICE);
    await tx.wait();
    */
  });

  it("should obtain WETH to initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    /*
    const { wrappedNativeTokenContract } = contracts;

    // Deposit ETH into W-ETH
    const tx: ContractTransactionResponse = await (
      wrappedNativeTokenContract.connect(deployer) as Contract
    ).deposit({
      value: INITIAL_WETH_AMOUNT,
    });
    await tx.wait();
    */
  });

  it("should approve Dutch Auction to spend POW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    /*
    const { pow1TokenContract, dutchAuctionContract } = contracts;

    // Approve Dutch Auction spending POW1 for deployer
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).approve(await dutchAuctionContract.getAddress(), INITIAL_POW1_SUPPLY);
    await tx.wait();
    */
  });

  it("should approve Dutch Auction to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    /*
    const { wrappedNativeTokenContract, dutchAuctionContract } = contracts;

    // Approve Dutch Auction spending WETH
    const tx: ContractTransactionResponse = await (
      wrappedNativeTokenContract.connect(deployer) as Contract
    ).approve(await dutchAuctionContract.getAddress(), INITIAL_WETH_AMOUNT);
    await tx.wait();
    */
  });

  it("should initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    /*
    // Initialize DutchAuction
    dutchAuctionContract.initialize(
      INITIAL_POW1_SUPPLY, // gameTokenAmount
      INITIAL_WETH_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
    */
  });
});

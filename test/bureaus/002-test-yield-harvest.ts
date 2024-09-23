/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { ContractLibraryEthers } from "../../src/interfaces/contractLibraryEthers";
import { ETH_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_POW1_SUPPLY,
  POW1_DECIMALS,
  ZERO_ADDRESS,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

// Token IDs of minted LP-NFTs
const LPPOW1_LPNFT_TOKEN_ID: bigint = 1n;

//
// Test cases
//

describe("Bureau 2: Yield Harvest", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture Constants
  //////////////////////////////////////////////////////////////////////////////

  const ERC20_ISSUER_ROLE: string =
    ethers.encodeBytes32String("ERC20_ISSUER_ROLE");
  const LPSFT_ISSUER_ROLE: string =
    ethers.encodeBytes32String("LPSFT_ISSUER_ROLE");
  const LPSFT_FARM_OPERATOR_ROLE: string = ethers.encodeBytes32String(
    "LPSFT_FARM_OPERATOR_ROLE",
  );

  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let ethersContracts: ContractLibraryEthers;
  let addressBook: AddressBook;
  let deployerContracts: ContractLibrary;
  let beneficiaryContracts: ContractLibrary;

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
    ethersContracts = await setupTest();

    // Get the address book
    addressBook = await getAddressBook(hardhat.network.name);

    // Get the contract library
    deployerContracts = getContractLibrary(deployer, addressBook);
    beneficiaryContracts = getContractLibrary(beneficiary, addressBook);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Dutch Auction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      dutchAuctionContract,
      lpPow1Contract,
      lpSftContract,
      pow1Contract,
      wrappedNativeContract,
    } = deployerContracts;
    const { pow1PoolContract, pow1PoolerContract } = ethersContracts;

    // Setup roles
    await lpPow1Contract.grantRole(ERC20_ISSUER_ROLE, addressBook.lpSft!);
    await lpSftContract.grantRole(
      LPSFT_ISSUER_ROLE,
      addressBook.pow1LpNftStakeFarm!,
    );

    // Obtain tokens
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);

    // Approve tokens
    await pow1Contract.approve(addressBook.dutchAuction!, INITIAL_POW1_SUPPLY);
    await wrappedNativeContract.approve(
      addressBook.dutchAuction!,
      INITIAL_WETH_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const pow1IsToken0: boolean = await pow1PoolerContract.gameIsToken0();
    const tx: ethers.ContractTransactionResponse =
      await pow1PoolContract.initialize(
        encodePriceSqrt(
          pow1IsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_POW1_SUPPLY,
          pow1IsToken0 ? INITIAL_POW1_SUPPLY : INITIAL_WETH_AMOUNT,
        ),
      );
    await tx.wait();

    // Initialize DutchAuction
    await dutchAuctionContract.initialize(
      INITIAL_POW1_SUPPLY, // gameTokenAmount
      INITIAL_WETH_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT_ISSUER_ROLE role to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPSFT_ISSUER_ROLE to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noLpSftContract } = deployerContracts;

    // Grant LPSFT_ISSUER_ROLE to YieldHarvest
    await noLpSftContract.grantRole(
      LPSFT_ISSUER_ROLE,
      addressBook.yieldHarvest!,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT_FARM_OPERATOR_ROLE role to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPSFT_FARM_OPERATOR_ROLE to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1LpSftLendFarmContract } = deployerContracts;
    const { yieldHarvestContract } = ethersContracts;

    // Grant LPSFT_FARM_OPERATOR_ROLE to YieldHarvest
    await pow1LpSftLendFarmContract.grantRole(
      LPSFT_FARM_OPERATOR_ROLE,
      await yieldHarvestContract.getAddress(),
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint POW1 reward to POW1 LP-SFT lend farm
  /////////////////////////////////////////////////////////////////////////////

  it("should mint POW1 reward to the POW1 LP-SFT lend farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1LpSftLendFarmContract } = deployerContracts;
    const { pow1TokenContract } = ethersContracts;

    // Grant issuer role to deployer
    const grantTx: ethers.ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as ethers.Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await grantTx.wait();

    // Mint POW1 to the POW1 LP-SFT lend farm
    const mintTx: ethers.ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as ethers.Contract
    ).mint(
      pow1LpSftLendFarmContract.address,
      ethers.parseUnits("5000", POW1_DECIMALS), // TODO: Handle rewards
    );
    await mintTx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Lend LP-SFT to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should verify LP-SFT is not lent before lending", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, noLpSftContract } = ethersContracts;

    chai
      .expect(await lpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(await beneficiary.getAddress());
    chai
      .expect(await noLpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(ZERO_ADDRESS);
  });

  it("should lend LP-SFT to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract } = beneficiaryContracts;

    // Lend LP-SFT to YieldHarvest
    await lpSftContract.safeTransferFrom(
      await beneficiary.getAddress(),
      addressBook.yieldHarvest!,
      LPPOW1_LPNFT_TOKEN_ID,
      1n,
      new Uint8Array(),
    );
  });

  it("should verify LP-SFT is lent to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, noLpSftContract } = ethersContracts;

    chai
      .expect(await lpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(addressBook.yieldHarvest!);
    chai
      .expect(await noLpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(await beneficiary.getAddress());
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT from YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT from YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noLpSftContract } = beneficiaryContracts;

    // Withdraw LP-SFT from YieldHarvest
    await noLpSftContract.safeTransferFrom(
      await beneficiary.getAddress(),
      addressBook.yieldHarvest!,
      LPPOW1_LPNFT_TOKEN_ID,
      1n,
      new Uint8Array(),
    );
  });

  it("should verify LP-SFT is not lent after withdrawing", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, noLpSftContract } = ethersContracts;

    chai
      .expect(await lpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(await beneficiary.getAddress());
    chai
      .expect(await noLpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(ZERO_ADDRESS);
  });
});

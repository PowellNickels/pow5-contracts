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
import { getNetworkName } from "../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
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
  let deployerAddress: `0x${string}`;
  let beneficiary: SignerWithAddress;
  let beneficiaryAddress: `0x${string}`;
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
    deployerAddress = (await deployer.getAddress()) as `0x${string}`;
    beneficiary = signers[1];
    beneficiaryAddress = (await beneficiary.getAddress()) as `0x${string}`;

    // A single fixture is used for the test suite
    await setupTest();

    // Get the network name
    const networkName: string = getNetworkName();

    // Get the address book
    addressBook = await getAddressBook(networkName);

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
      pow1LpNftStakeFarmContract,
      pow1PoolContract,
      wrappedNativeContract,
    } = deployerContracts;

    // Setup roles
    await lpPow1Contract.grantRole(ERC20_ISSUER_ROLE, lpSftContract.address);
    await lpSftContract.grantRole(
      LPSFT_ISSUER_ROLE,
      pow1LpNftStakeFarmContract.address,
    );

    // Obtain tokens
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);

    // Approve tokens
    await pow1Contract.approve(
      dutchAuctionContract.address,
      INITIAL_POW1_SUPPLY,
    );
    await wrappedNativeContract.approve(
      dutchAuctionContract.address,
      INITIAL_WETH_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    let pow1IsToken0: boolean;
    const token0: `0x${string}` = await pow1PoolContract.token0();
    const token1: `0x${string}` = await pow1PoolContract.token1();
    if (
      token0.toLowerCase() === pow1Contract.address.toLowerCase() &&
      token1.toLowerCase() === wrappedNativeContract.address.toLowerCase()
    ) {
      pow1IsToken0 = true;
    } else if (
      token0.toLowerCase() === wrappedNativeContract.address.toLowerCase() &&
      token1.toLowerCase() === pow1Contract.address.toLowerCase()
    ) {
      pow1IsToken0 = false;
    } else {
      throw new Error("POW1 pool tokens are incorrect");
    }
    chai.expect(pow1IsToken0).to.be.a("boolean");
    await pow1PoolContract.initialize(
      encodePriceSqrt(
        pow1IsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_POW1_SUPPLY,
        pow1IsToken0 ? INITIAL_POW1_SUPPLY : INITIAL_WETH_AMOUNT,
      ),
    );

    // Initialize DutchAuction
    await dutchAuctionContract.initialize(
      INITIAL_POW1_SUPPLY, // gameTokenAmount
      INITIAL_WETH_AMOUNT, // assetTokenAmount
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT_ISSUER_ROLE role to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPSFT_ISSUER_ROLE to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noLpSftContract, yieldHarvestContract } = deployerContracts;

    // Grant LPSFT_ISSUER_ROLE to YieldHarvest
    await noLpSftContract.grantRole(
      LPSFT_ISSUER_ROLE,
      yieldHarvestContract.address,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT_FARM_OPERATOR_ROLE role to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPSFT_FARM_OPERATOR_ROLE to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1LpSftLendFarmContract, yieldHarvestContract } =
      deployerContracts;

    // Grant LPSFT_FARM_OPERATOR_ROLE to YieldHarvest
    await pow1LpSftLendFarmContract.grantRole(
      LPSFT_FARM_OPERATOR_ROLE,
      yieldHarvestContract.address,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint POW1 reward to POW1 LP-SFT lend farm
  /////////////////////////////////////////////////////////////////////////////

  it("should mint POW1 reward to the POW1 LP-SFT lend farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract, pow1LpSftLendFarmContract } = deployerContracts;

    // Grant issuer role to deployer
    await pow1Contract.grantRole(ERC20_ISSUER_ROLE, deployerAddress);

    // Mint POW1 to the POW1 LP-SFT lend farm
    await pow1Contract.mint(
      pow1LpSftLendFarmContract.address,
      ethers.parseUnits("5000", POW1_DECIMALS), // TODO: Handle rewards
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Lend LP-SFT to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should verify LP-SFT is not lent before lending", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, noLpSftContract } = deployerContracts;

    chai
      .expect(await lpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(beneficiaryAddress);
    chai
      .expect(await noLpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(ZERO_ADDRESS);
  });

  it("should lend LP-SFT to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, yieldHarvestContract } = beneficiaryContracts;

    // Lend LP-SFT to YieldHarvest
    await lpSftContract.safeTransferFrom(
      beneficiaryAddress,
      yieldHarvestContract.address,
      LPPOW1_LPNFT_TOKEN_ID,
      1n,
      new Uint8Array(),
    );
  });

  it("should verify LP-SFT is lent to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, noLpSftContract, yieldHarvestContract } =
      deployerContracts;

    chai
      .expect(await lpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(yieldHarvestContract.address);
    chai
      .expect(await noLpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(beneficiaryAddress);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT from YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT from YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noLpSftContract, yieldHarvestContract } = beneficiaryContracts;

    // Withdraw LP-SFT from YieldHarvest
    await noLpSftContract.safeTransferFrom(
      beneficiaryAddress,
      yieldHarvestContract.address,
      LPPOW1_LPNFT_TOKEN_ID,
      1n,
      new Uint8Array(),
    );
  });

  it("should verify LP-SFT is not lent after withdrawing", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, noLpSftContract } = deployerContracts;

    chai
      .expect(await lpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(beneficiaryAddress);
    chai
      .expect(await noLpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID))
      .to.equal(ZERO_ADDRESS);
  });
});

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { Contract, ContractTransactionResponse, ethers } from "ethers";
import * as hardhat from "hardhat";

import { DutchAuctionContract } from "../../src/contracts/bureaus/dutchAuctionContract";
import { YieldHarvestContract } from "../../src/contracts/bureaus/yieldHarvestContract";
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
  let contracts: ContractLibraryEthers;
  let pow1IsToken0: boolean;

  let dutchAuctionContract: DutchAuctionContract;
  let yieldHarvestContract: YieldHarvestContract;

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
    contracts = await setupTest();

    // Set up DutchAuction for deployer
    dutchAuctionContract = new DutchAuctionContract(deployer, {
      dutchAuction: await contracts.dutchAuctionContract.getAddress(),
    });

    // Set up YieldHarvest for beneficiary
    yieldHarvestContract = new YieldHarvestContract(beneficiary, {
      yieldHarvest: await contracts.yieldHarvestContract.getAddress(),
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Mint initial LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPPOW1 issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpPow1TokenContract, lpSftContract } = contracts;

    // Grant ERC-20 issuer role to LP-SFT
    const tx: ContractTransactionResponse = await (
      lpPow1TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await lpSftContract.getAddress());
    await tx.wait();
  });

  it("should grant LP-SFT minter role to LPPOW1 stake farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, pow1LpNftStakeFarmContract } = contracts;

    // Grant LP-SFT minter role to LPPOW1 stake farm
    const tx: ContractTransactionResponse = await (
      lpSftContract.connect(deployer) as Contract
    ).grantRole(
      LPSFT_ISSUER_ROLE,
      await pow1LpNftStakeFarmContract.getAddress(),
    );
    await tx.wait();
  });

  it("should get pool token order for LPPOW1", async function (): Promise<void> {
    const { pow1PoolerContract } = contracts;

    // Get pool token order
    pow1IsToken0 = await pow1PoolerContract.gameIsToken0();
    chai.expect(pow1IsToken0).to.be.a("boolean");
  });

  it("should initialize the LPPOW1 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

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
  });

  it("should obtain WETH to initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeTokenContract } = contracts;

    // Deposit ETH into W-ETH
    const tx: ContractTransactionResponse = await (
      wrappedNativeTokenContract.connect(deployer) as Contract
    ).deposit({
      value: INITIAL_WETH_AMOUNT,
    });
    await tx.wait();
  });

  it("should approve Dutch Auction to spend POW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, dutchAuctionContract } = contracts;

    // Approve Dutch Auction spending POW1 for deployer
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).approve(await dutchAuctionContract.getAddress(), INITIAL_POW1_SUPPLY);
    await tx.wait();
  });

  it("should approve Dutch Auction to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeTokenContract, dutchAuctionContract } = contracts;

    // Approve Dutch Auction spending WETH
    const tx: ContractTransactionResponse = await (
      wrappedNativeTokenContract.connect(deployer) as Contract
    ).approve(await dutchAuctionContract.getAddress(), INITIAL_WETH_AMOUNT);
    await tx.wait();
  });

  it("should initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Initialize DutchAuction
    await dutchAuctionContract.initialize(
      INITIAL_POW1_SUPPLY, // gameTokenAmount
      INITIAL_WETH_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant DEFI_OPERATOR_ROLE role to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should grant DEFI_OPERATOR_ROLE to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract, yieldHarvestContract } = contracts;

    // Grant DEFI_OPERATOR_ROLE to YieldHarvest
    const tx: ContractTransactionResponse = await (
      defiManagerContract.connect(deployer) as Contract
    ).grantRole(DEFI_OPERATOR_ROLE, await yieldHarvestContract.getAddress());
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT_FARM_OPERATOR_ROLE role to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPSFT_FARM_OPERATOR_ROLE to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1LpSftLendFarmContract, yieldHarvestContract } = contracts;

    // Grant LPSFT_FARM_OPERATOR_ROLE to YieldHarvest
    const tx: ContractTransactionResponse = await (
      pow1LpSftLendFarmContract.connect(deployer) as Contract
    ).grantRole(
      LPSFT_FARM_OPERATOR_ROLE,
      await yieldHarvestContract.getAddress(),
    );
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint POW1 reward to POW1 LP-SFT lend farm
  /////////////////////////////////////////////////////////////////////////////

  it("should mint POW1 reward to the POW1 LP-SFT lend farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1LpSftLendFarmContract, pow1TokenContract } = contracts;

    // Grant issuer role to deployer
    const grantTx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await grantTx.wait();

    // Mint POW1 to the POW1 LP-SFT lend farm
    const mintTx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).mint(
      await pow1LpSftLendFarmContract.getAddress(),
      ethers.parseUnits("50", POW1_DECIMALS), // TODO: Handle rewards
    );
    await mintTx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Lend LP-SFT to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should verify LP-SFT is not lent", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract } = contracts;

    // Check if LP-SFT is lent
    const borrower: string = await defiManagerContract.borrower(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(borrower).to.equal(ZERO_ADDRESS);
  });

  it("should lend LP-SFT to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Lend LP-SFT to YieldHarvest
    await yieldHarvestContract.lendLpSft(LPPOW1_LPNFT_TOKEN_ID);
  });

  it("should verify LP-SFT is lent to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract, yieldHarvestContract } = contracts;

    // Check if LP-SFT is lent
    const borrower: string = await defiManagerContract.borrower(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(borrower).to.equal(await yieldHarvestContract.getAddress());
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT from YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT from YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Withdraw LP-SFT from YieldHarvest
    await yieldHarvestContract.withdrawLpSft(LPPOW1_LPNFT_TOKEN_ID);
  });

  it("should verify LP-SFT is not lent", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract } = contracts;

    // Check if LP-SFT is lent
    const borrower: string = await defiManagerContract.borrower(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(borrower).to.equal(ZERO_ADDRESS);
  });
});

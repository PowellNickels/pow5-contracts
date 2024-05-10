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

import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { ContractLibraryEthers } from "../../src/interfaces/contractLibraryEthers";
import { ETH_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPPOW1_AMOUNT,
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_AMOUNT,
  INITIAL_POW5_PRICE,
  LPPOW1_DECIMALS,
  POW1_DECIMALS,
  POW5_DECIMALS,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";
import { getAddressBook } from "../../src/utils/getAddressBook";
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

// POW1 test reward for LPPOW1 staking incentive
const LPPOW1_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// Token IDs of minted LP-NFTs
const LPPOW1_LPNFT_TOKEN_ID: bigint = 1n;

//
// Test cases
//

describe("Bureau 3: Liquidity Forge", () => {
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

    // Get pool token order
    const pow1IsToken0: boolean = await pow1PoolerContract.gameIsToken0();

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow1IsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_POW1_SUPPLY,
      pow1IsToken0 ? INITIAL_POW1_SUPPLY : INITIAL_WETH_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const tx: ContractTransactionResponse =
      await pow1PoolContract.initialize(INITIAL_PRICE);
    await tx.wait();

    // Initialize DutchAuction
    await dutchAuctionContract.initialize(
      INITIAL_POW1_SUPPLY, // gameTokenAmount
      INITIAL_WETH_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Yield Harvest
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noLpSftContract, pow1Contract } = deployerContracts;
    const { lpSftContract } = beneficiaryContracts;
    const { pow1LpSftLendFarmContract } = ethersContracts;

    // Grant roles
    await noLpSftContract.grantRole(
      LPSFT_ISSUER_ROLE,
      addressBook.yieldHarvest!,
    );
    const tx: ContractTransactionResponse = await (
      pow1LpSftLendFarmContract.connect(deployer) as Contract
    ).grantRole(LPSFT_FARM_OPERATOR_ROLE, addressBook.yieldHarvest!);
    await tx.wait();
    await pow1Contract.grantRole(
      ERC20_ISSUER_ROLE,
      await deployer.getAddress(),
    );

    // Mint POW1 to the POW1 LP-SFT lend farm
    await pow1Contract.mint(
      addressBook.pow1LpSftLendFarm!,
      LPPOW1_REWARD_AMOUNT,
    );

    // Lend LP-SFT to YieldHarvest
    await lpSftContract.safeTransferFrom(
      await beneficiary.getAddress(),
      addressBook.yieldHarvest!,
      LPPOW1_LPNFT_TOKEN_ID,
      1n,
      new Uint8Array(),
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant DEFI_OPERATOR_ROLE role to LiquidityForge
  //////////////////////////////////////////////////////////////////////////////

  it("should grant DEFI_OPERATOR_ROLE to LiquidityForge", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract } = deployerContracts;

    // Grant DEFI_OPERATOR_ROLE to LiquidityForge
    await defiManagerContract.grantRole(
      DEFI_OPERATOR_ROLE,
      addressBook.liquidityForge!,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant ERC20_FARM_OPERATOR_ROLE role to LiquidityForge
  //////////////////////////////////////////////////////////////////////////////

  it("should grant ERC20_FARM_OPERATOR_ROLE to LiquidityForge", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5InterestFarmContract } = ethersContracts;

    // Grant ERC20_FARM_OPERATOR_ROLE to LiquidityForge
    const tx: ContractTransactionResponse = await (
      pow5InterestFarmContract.connect(deployer) as Contract
    ).grantRole(ERC20_FARM_OPERATOR_ROLE, addressBook.liquidityForge!);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant POW5 issuer role to DefiManager
  //////////////////////////////////////////////////////////////////////////////

  it("should grant POW5 issuer role to DefiManager", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = deployerContracts;

    // Grant ERC20_ISSUER_ROLE to DefiManager
    await pow5Contract.grantRole(ERC20_ISSUER_ROLE, addressBook.defiManager!);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant NOPOW5 issuer role to DefiManager
  //////////////////////////////////////////////////////////////////////////////

  it("should grant NOPOW5 issuer rol to DefiManager", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noPow5Contract } = deployerContracts;

    // Grant ERC20_ISSUER_ROLE to DefiManager
    await noPow5Contract.grantRole(ERC20_ISSUER_ROLE, addressBook.defiManager!);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Borrow POW5 from LiquidityForge
  //////////////////////////////////////////////////////////////////////////////

  it("should fail to exceed 100x collateralization ratio", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;

    // Borrow POW5 from LiquidityForge
    try {
      await liquidityForgeContract.borrowPow5(
        LPPOW1_LPNFT_TOKEN_ID, // tokenId
        INITIAL_POW5_AMOUNT + 1n, // amount
        await beneficiary.getAddress(), // receiver
      );
      chai.assert.fail("Expected an error");
    } catch (error: unknown) {
      chai.expect(error).to.be.an("error");
    }
  });

  it("should check POW1 LP-sFT LPPOW balance", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Calculate DeFi properties
    const lpPow1Value: string = ethers.formatUnits(
      INITIAL_LPPOW1_AMOUNT / BigInt(1 / INITIAL_POW5_PRICE),
      LPPOW1_DECIMALS,
    );

    console.log(
      `    LP-SFT LPPOW1 balance: ${ethers.formatUnits(
        INITIAL_LPPOW1_AMOUNT,
        LPPOW1_DECIMALS,
      )} LPPOW1 ($${lpPow1Value.toLocaleString()})`,
    );
  });

  it("should borrow POW5 from LiquidityForge", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;

    // Calculate DeFi properties
    const pow5Value: string = ethers.formatUnits(
      INITIAL_POW5_AMOUNT / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    console.log(
      `    Borrowing POW5: ${ethers.formatUnits(
        INITIAL_POW5_AMOUNT,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value.toLocaleString()})`,
    );

    // Borrow POW5 from LiquidityForge
    await liquidityForgeContract.borrowPow5(
      LPPOW1_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
      await beneficiary.getAddress(), // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after borrowing POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after borrowing POW5", async function (): Promise<void> {
    const { defiManagerContract, pow5Contract } = beneficiaryContracts;

    const pow5Amount: bigint = await pow5Contract.balanceOf(
      await beneficiary.getAddress(),
    );
    chai.expect(pow5Amount).to.equal(INITIAL_POW5_AMOUNT);

    const noPow5Amount: bigint = await defiManagerContract.noPow5Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(noPow5Amount).to.equal(INITIAL_POW5_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test withdrawing LP-SFT before POW5 loan is repaid
  //////////////////////////////////////////////////////////////////////////////

  it("should fail to withdraw LP-SFT before POW5 loan is repaid", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { noLpSftContract } = beneficiaryContracts;

    // Attempt to withdraw LP-SFT before POW5 loan is repaid
    try {
      await noLpSftContract.safeTransferFrom(
        await beneficiary.getAddress(),
        addressBook.yieldHarvest!,
        LPPOW1_LPNFT_TOKEN_ID,
        1n,
        new Uint8Array(),
      );
      chai.assert.fail("Expected an error");
    } catch (error: unknown) {
      chai.expect(error).to.be.an("error");
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve LiquidityForge to spend POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should approve LiquidityForge to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5Contract } = beneficiaryContracts;

    // Approve LiquidityForge to spend POW5
    await pow5Contract.approve(
      addressBook.liquidityForge!,
      INITIAL_POW5_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Repay POW5 loan
  //////////////////////////////////////////////////////////////////////////////

  it("should repay POW5 loan", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;
    // Repay POW5 loan
    await liquidityForgeContract.repayPow5(
      LPPOW1_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after repaying POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after repaying POW5", async function (): Promise<void> {
    const { defiManagerContract, pow5Contract } = beneficiaryContracts;

    const pow5Amount: bigint = await pow5Contract.balanceOf(
      await deployer.getAddress(),
    );
    chai.expect(pow5Amount).to.equal(0n);

    const noPow5Amount: bigint = await defiManagerContract.noPow5Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(noPow5Amount).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT after POW5 loan is repaid
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT from YieldHarvest after POW5 loan is repaid", async function (): Promise<void> {
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

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after withdrawing LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after repaying POW5", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    const pow1Amount: bigint = await defiManagerContract.pow1Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(pow1Amount).to.not.equal(0n);

    const lpPow1Amount: bigint = await defiManagerContract.lpPow1Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(lpPow1Amount).to.equal(INITIAL_LPPOW1_AMOUNT);

    const noPow5Amount: bigint = await defiManagerContract.noPow5Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(noPow5Amount).to.equal(0n);
  });
});

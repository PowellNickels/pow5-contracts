/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { ContractLibraryEthers } from "../../src/interfaces/contractLibraryEthers";
import { ETH_PRICE, USDC_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_LPPOW5_USDC_VALUE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_AMOUNT,
  INITIAL_POW5_DEPOSIT,
  POW1_DECIMALS,
  USDC_DECIMALS,
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

// Initial amount of USDC to deposit into the Reverse Repo
const INITIAL_USDC_AMOUNT: bigint =
  ethers.parseUnits(INITIAL_LPPOW5_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

// POW1 test reward for LPPOW1 staking incentive
const LPPOW1_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// POW1 test reward for LPPOW5 staking incentive
const LPPOW5_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// Token IDs of minted LP-NFTs
const LPPOW1_LPNFT_TOKEN_ID: bigint = 1n;

//
// Test cases
//

describe("Bureau integration test", () => {
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

  let addressBook: AddressBook;

  let deployerContracts: ContractLibrary;
  let beneficiaryContracts: ContractLibrary;
  let ethersContracts: ContractLibraryEthers;

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

    // Get the contract libraries
    deployerContracts = getContractLibrary(deployer, addressBook);
    beneficiaryContracts = getContractLibrary(beneficiary, addressBook);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Setup roles
  //////////////////////////////////////////////////////////////////////////////

  it("should grant roles", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      defiManagerContract,
      lpPow1Contract,
      lpPow5Contract,
      lpSftContract,
      noLpSftContract,
      noPow5Contract,
      pow1Contract,
      pow1LpSftLendFarmContract,
      pow5Contract,
      pow5InterestFarmContract,
    } = deployerContracts;

    // Grant LPSFT roles
    await lpPow1Contract.grantRole(ERC20_ISSUER_ROLE, addressBook.lpSft!);
    await lpPow5Contract.grantRole(ERC20_ISSUER_ROLE, addressBook.lpSft!);

    // Grant DeFi Manager roles
    await pow5Contract.grantRole(ERC20_ISSUER_ROLE, addressBook.defiManager!);
    await noPow5Contract.grantRole(ERC20_ISSUER_ROLE, addressBook.defiManager!);

    // Grant farm roles
    await lpSftContract.grantRole(
      LPSFT_ISSUER_ROLE,
      addressBook.pow1LpNftStakeFarm!,
    );
    await lpSftContract.grantRole(
      LPSFT_ISSUER_ROLE,
      addressBook.pow5LpNftStakeFarm!,
    );

    // Grant Yield Harvest roles
    await noLpSftContract.grantRole(
      LPSFT_ISSUER_ROLE,
      addressBook.yieldHarvest!,
    );

    await defiManagerContract.grantRole(
      DEFI_OPERATOR_ROLE,
      addressBook.liquidityForge!,
    );

    await pow1LpSftLendFarmContract.grantRole(
      LPSFT_FARM_OPERATOR_ROLE,
      addressBook.yieldHarvest!,
    );
    await pow5InterestFarmContract.grantRole(
      ERC20_FARM_OPERATOR_ROLE,
      addressBook.liquidityForge!,
    );

    // For testing
    await pow1Contract.grantRole(
      ERC20_ISSUER_ROLE,
      await deployer.getAddress(),
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Obtain tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain tokens", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract, wrappedNativeContract } = deployerContracts;
    const { usdcTokenContract } = ethersContracts;

    // Deposit W-ETH
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);

    // Mint POW1
    await pow1Contract.mint(
      addressBook.pow1LpSftLendFarm!,
      LPPOW1_REWARD_AMOUNT,
    );
    await pow1Contract.mint(await deployer.getAddress(), LPPOW5_REWARD_AMOUNT);

    // Mint USDC
    const txMintUsdc: ethers.ContractTransactionResponse =
      await usdcTokenContract.mint(
        await deployer.getAddress(),
        INITIAL_USDC_AMOUNT,
      );
    await txMintUsdc.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Approve tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should approve tokens", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract, pow5Contract, wrappedNativeContract } =
      deployerContracts;
    const { usdcTokenContract } = ethersContracts;

    // Approve Dutch Auction
    await pow1Contract.approve(addressBook.dutchAuction!, INITIAL_POW1_SUPPLY);
    await wrappedNativeContract.approve(
      addressBook.dutchAuction!,
      INITIAL_WETH_AMOUNT,
    );

    // Approve LPPOW5 stake farm
    await pow1Contract.approve(
      addressBook.pow5LpNftStakeFarm!,
      LPPOW5_REWARD_AMOUNT,
    );

    // Approve Reverse Repo
    await pow5Contract.approve(addressBook.reverseRepo!, INITIAL_POW5_DEPOSIT);
    const txApproveUsdc: ethers.ContractTransactionResponse = await (
      usdcTokenContract.connect(deployer) as ethers.Contract
    ).approve(addressBook.reverseRepo!, INITIAL_USDC_AMOUNT);
    await txApproveUsdc.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize pools
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Uniswap V3 pools", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      pow1PoolContract,
      pow1PoolerContract,
      pow5PoolContract,
      pow5PoolerContract,
    } = ethersContracts;

    // Initialize the Uniswap V3 pool for POW1
    const pow1IsToken0: boolean = await pow1PoolerContract.gameIsToken0();
    const txPow1Initialize: ethers.ContractTransactionResponse =
      await pow1PoolContract.initialize(
        encodePriceSqrt(
          pow1IsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_POW1_SUPPLY,
          pow1IsToken0 ? INITIAL_POW1_SUPPLY : INITIAL_WETH_AMOUNT,
        ),
      );
    await txPow1Initialize.wait();

    // Initialize the Uniswap V3 pool for POW5
    const pow5IsToken0: boolean = await pow5PoolerContract.gameIsToken0();
    const txPow5Initialize: ethers.ContractTransactionResponse =
      await pow5PoolContract.initialize(
        encodePriceSqrt(
          pow5IsToken0 ? INITIAL_USDC_AMOUNT : INITIAL_POW5_DEPOSIT,
          pow5IsToken0 ? INITIAL_POW5_DEPOSIT : INITIAL_USDC_AMOUNT,
        ),
      );
    await txPow5Initialize.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize farms
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize farms", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5LpNftStakeFarmContract } = deployerContracts;

    // Create LPPOW5 incentive
    await pow5LpNftStakeFarmContract.createIncentive(LPPOW5_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Dutch Auction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = deployerContracts;

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

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Liquidity Forge
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize LiquidityForge", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract } = beneficiaryContracts;
    const { pow5Contract } = beneficiaryContracts;

    // Borrow POW5 from LiquidityForge
    await liquidityForgeContract.borrowPow5(
      LPPOW1_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
      await beneficiary.getAddress(), // receiver
    );

    // Transfer POW5 to deployer
    await pow5Contract.transfer(
      await deployer.getAddress(),
      INITIAL_POW5_DEPOSIT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test Setup: Initialize Reverse Repo
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Reverse Repo", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = deployerContracts;

    // Initialize ReverseRepo
    reverseRepoContract.initialize(
      INITIAL_POW5_DEPOSIT, // gameTokenAmount
      INITIAL_USDC_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
  });
});

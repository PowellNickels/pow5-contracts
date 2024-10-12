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
import { getNetworkName } from "../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { TestERC20MintableContract } from "../../src/interfaces/test/token/erc20/extensions/testErc20MintableContract";
import { AccessControlContract } from "../../src/interfaces/zeppelin/access/accessControlContract";
import { ERC20Contract } from "../../src/interfaces/zeppelin/token/erc20/erc20Contract";
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
      liquidityForgeContract,
      lpPow1Contract,
      lpPow5Contract,
      lpSftContract,
      noLpSftContract,
      noPow5Contract,
      pow1Contract,
      pow1LpNftStakeFarmContract,
      pow1LpSftLendFarmContract,
      pow5Contract,
      pow5InterestFarmContract,
      pow5LpNftStakeFarmContract,
      yieldHarvestContract,
    }: ContractLibrary = deployerContracts;

    // Declarative structure for roles with contract and address pairs
    const roleAssignments: Record<
      string,
      Array<{ contract: AccessControlContract; address: `0x${string}` }>
    > = {
      // ERC20_ISSUER_ROLE
      [ERC20_ISSUER_ROLE]: [
        {
          contract: pow1Contract,
          address: deployerAddress,
        },
        {
          contract: pow5Contract,
          address: defiManagerContract.address,
        },
        {
          contract: noPow5Contract,
          address: defiManagerContract.address,
        },
        {
          contract: lpPow1Contract,
          address: lpSftContract.address,
        },
        {
          contract: lpPow5Contract,
          address: lpSftContract.address,
        },
      ],
      // LPSFT_ISSUER_ROLE
      [LPSFT_ISSUER_ROLE]: [
        {
          contract: lpSftContract,
          address: pow1LpNftStakeFarmContract.address,
        },
        {
          contract: lpSftContract,
          address: pow5LpNftStakeFarmContract.address,
        },
        {
          contract: noLpSftContract,
          address: yieldHarvestContract.address,
        },
      ],
      // DEFI_OPERATOR_ROLE
      [DEFI_OPERATOR_ROLE]: [
        {
          contract: defiManagerContract,
          address: liquidityForgeContract.address,
        },
      ],
      // LPSFT_FARM_OPERATOR_ROLE
      [LPSFT_FARM_OPERATOR_ROLE]: [
        {
          contract: pow1LpSftLendFarmContract,
          address: yieldHarvestContract.address,
        },
      ],
      // ERC20_FARM_OPERATOR_ROLE
      [ERC20_FARM_OPERATOR_ROLE]: [
        {
          contract: pow5InterestFarmContract,
          address: liquidityForgeContract.address,
        },
      ],
    };

    // Loop over the declarative structure to grant roles
    for (const [role, assignments] of Object.entries(roleAssignments)) {
      for (const { contract, address } of assignments) {
        await contract.grantRole(role, address);
      }
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Obtain tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain tokens", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract, pow1LpSftLendFarmContract, wrappedNativeContract } =
      deployerContracts;
    const testErc20MintableContract: TestERC20MintableContract =
      new TestERC20MintableContract(deployer, addressBook.usdcToken!);

    // Deposit W-ETH
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);

    // Mint POW1
    await pow1Contract.mint(
      pow1LpSftLendFarmContract.address,
      LPPOW1_REWARD_AMOUNT,
    );
    await pow1Contract.mint(deployerAddress, LPPOW5_REWARD_AMOUNT);

    // Mint USDC
    await testErc20MintableContract.mint(deployerAddress, INITIAL_USDC_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Approve tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should approve tokens", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      dutchAuctionContract,
      pow1Contract,
      pow5Contract,
      pow5LpNftStakeFarmContract,
      reverseRepoContract,
      wrappedNativeContract,
    } = deployerContracts;
    const usdcTokenContract: ERC20Contract = new ERC20Contract(
      deployer,
      addressBook.usdcToken!,
    );

    // Approve Dutch Auction
    await pow1Contract.approve(
      dutchAuctionContract.address,
      INITIAL_POW1_SUPPLY,
    );
    await wrappedNativeContract.approve(
      dutchAuctionContract.address,
      INITIAL_WETH_AMOUNT,
    );

    // Approve LPPOW5 stake farm
    await pow1Contract.approve(
      pow5LpNftStakeFarmContract.address,
      LPPOW5_REWARD_AMOUNT,
    );

    // Approve Reverse Repo
    await pow5Contract.approve(
      reverseRepoContract.address,
      INITIAL_POW5_DEPOSIT,
    );
    await usdcTokenContract.approve(
      reverseRepoContract.address,
      INITIAL_USDC_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize pools
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Uniswap V3 pools", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const {
      pow1Contract,
      pow1MarketPoolContract,
      pow5Contract,
      pow5StablePoolContract,
      usdcContract,
      wrappedNativeContract,
    } = deployerContracts;

    // Get POW1 pool token order
    let pow1IsToken0: boolean;
    const pow1Token0: `0x${string}` = await pow1MarketPoolContract.token0();
    const pow1Token1: `0x${string}` = await pow1MarketPoolContract.token1();
    if (
      pow1Token0.toLowerCase() === pow1Contract.address.toLowerCase() &&
      pow1Token1.toLowerCase() === wrappedNativeContract.address.toLowerCase()
    ) {
      pow1IsToken0 = true;
    } else if (
      pow1Token0.toLowerCase() ===
        wrappedNativeContract.address.toLowerCase() &&
      pow1Token1.toLowerCase() === pow1Contract.address.toLowerCase()
    ) {
      pow1IsToken0 = false;
    } else {
      throw new Error("POW1 pool tokens are incorrect");
    }

    // Initialize the Uniswap V3 pool for POW1
    await pow1MarketPoolContract.initialize(
      encodePriceSqrt(
        pow1IsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_POW1_SUPPLY,
        pow1IsToken0 ? INITIAL_POW1_SUPPLY : INITIAL_WETH_AMOUNT,
      ),
    );

    // Get POW5 pool token order
    let pow5IsToken0: boolean;
    const pow5Token0: `0x${string}` = await pow5StablePoolContract.token0();
    const pow5Token1: `0x${string}` = await pow5StablePoolContract.token1();
    if (
      pow5Token0.toLowerCase() === pow5Contract.address.toLowerCase() &&
      pow5Token1.toLowerCase() === usdcContract.address.toLowerCase()
    ) {
      pow5IsToken0 = true;
    } else if (
      pow5Token0.toLowerCase() === usdcContract.address.toLowerCase() &&
      pow5Token1.toLowerCase() === pow5Contract.address.toLowerCase()
    ) {
      pow5IsToken0 = false;
    } else {
      throw new Error("POW1 pool tokens are incorrect");
    }

    // Initialize the Uniswap V3 pool for POW5
    await pow5StablePoolContract.initialize(
      encodePriceSqrt(
        pow5IsToken0 ? INITIAL_USDC_AMOUNT : INITIAL_POW5_DEPOSIT,
        pow5IsToken0 ? INITIAL_POW5_DEPOSIT : INITIAL_USDC_AMOUNT,
      ),
    );
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
      beneficiaryAddress, // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Yield Harvest
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize YieldHarvest", async function (): Promise<void> {
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
      beneficiaryAddress, // receiver
    );

    // Transfer POW5 to deployer
    await pow5Contract.transfer(deployerAddress, INITIAL_POW5_DEPOSIT);
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
      beneficiaryAddress, // receiver
    );
  });
});

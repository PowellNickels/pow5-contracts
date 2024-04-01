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

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import {
  Contract,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  ethers,
  EventLog,
  Log,
  Result,
} from "ethers";
import * as hardhat from "hardhat";

import { ContractLibraryEthers } from "../../src/interfaces/contractLibraryEthers";
import { ETH_PRICE, USDC_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPPOW1_AMOUNT,
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_LPPOW5_AMOUNT,
  INITIAL_LPPOW5_USDC_VALUE,
  INITIAL_POW1_PRICE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_DEPOSIT,
  INITIAL_POW5_PRICE,
  LPPOW1_DECIMALS,
  LPPOW1_POOL_FEE,
  LPPOW5_DECIMALS,
  LPPOW5_POOL_FEE,
  POW1_DECIMALS,
  POW5_DECIMALS,
  USDC_DECIMALS,
  ZERO_ADDRESS,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";
import { extractJSONFromURI } from "../../src/utils/lpNftUtils";
import { getMaxTick, getMinTick } from "../../src/utils/tickMath";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// POW1 test reward for LPPOW1 and LPPOW5 staking incentives, in wei of POW1
const LPPOW1_REWARD_AMOUNT: bigint = 1_000_000n;
const LPPOW5_REWARD_AMOUNT: bigint = 1_000n;

// Initial amount of WETH to deposit into the Dutch Auction
const WETH_TOKEN_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in WETH
const USDC_TOKEN_AMOUNT: bigint =
  ethers.parseUnits(INITIAL_LPPOW5_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

// The LPPOW1 and LPPOW5 LP-NFT token IDs
const POW1_LPNFT_TOKEN_ID: bigint = 1n;
const POW5_LPNFT_TOKEN_ID: bigint = 2n;

// The initial tick of the pool, i.e. log base 1.0001 of the starting price of
// the pool. TODO: Calculate these
const LPPOW1_INITIAL_TICK_LOW = -126155; // If POW1 is token0
const LPPOW1_INITIAL_TICK_HIGH = -(LPPOW1_INITIAL_TICK_LOW + 1); // If POW1 is token1
const LPPOW5_INITIAL_TICK_LOW = -237202; // If POW5 is token0
const LPPOW5_INITIAL_TICK_HIGH = -(LPPOW5_INITIAL_TICK_LOW + 1); // If POW5 is token1

// Remaining dust balances after depositing into LP pools
const LPPOW1_POW1_DUST: bigint = 462n;
const LPPOW1_WETH_DUST: bigint = 0n;
const LPPOW5_POW5_DUST: bigint = 134_419n;
const LPPOW5_USDC_DUST: bigint = 0n;

//
// Debug parameters
//

// Debug option to print the NFT's image data URI
const DEBUG_PRINT_NFT_IMAGE: boolean = false;

//
// Test cases
//

describe("Token Pools", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture Constants
  //////////////////////////////////////////////////////////////////////////////

  const ERC20_ISSUER_ROLE: string =
    ethers.encodeBytes32String("ERC20_ISSUER_ROLE");
  const LPSFT_ISSUER_ROLE: string =
    ethers.encodeBytes32String("LPSFT_ISSUER_ROLE");

  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let beneficiaryAddress: string;
  let contracts: ContractLibraryEthers;
  let pow1IsToken0: boolean;
  let pow5IsToken0: boolean;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use ethers to get the deployer, which is the first account and used to
    // deploy the contracts
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];

    // Get the wallet addresses
    const accounts: string[] = await hardhat.getUnnamedAccounts();
    beneficiaryAddress = accounts[1];

    // A single fixture is used for the test suite
    contracts = await setupTest();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Wrap into WETH for LPPOW1 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should wrap ETH for LPPOW1 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeTokenContract } = contracts;

    // Wrap ETH
    const tx: ContractTransactionResponse =
      await wrappedNativeTokenContract.deposit({ value: WETH_TOKEN_AMOUNT });
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Mint USDC for the LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should mint USDC for LPPOW5 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { usdcTokenContract } = contracts;

    // Mint USDC
    const tx: ContractTransactionResponse = await usdcTokenContract.mint(
      beneficiaryAddress,
      USDC_TOKEN_AMOUNT,
    );
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Mint LPPOW1 and LPPOW5 staking rewards
  //////////////////////////////////////////////////////////////////////////////

  it("should grant POW1 issuer role to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await tx.wait();
  });

  it("should mint LPPOW1 reward to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract } = contracts;

    // Mint POW1
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).mint(await deployer.getAddress(), LPPOW1_REWARD_AMOUNT);
    await tx.wait();
  });

  it("should mint LPPOW5 reward to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract } = contracts;

    // Mint POW1
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).mint(await deployer.getAddress(), LPPOW5_REWARD_AMOUNT);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Transfer initial POW1 supply
  //////////////////////////////////////////////////////////////////////////////

  //
  // POW1 initial supply is minted to the deployer, who then transfers it to the
  // beneficiary.
  //

  it("should transfer initial POW1 to beneficiary", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract } = contracts;

    // Transfer POW1 to beneficiary
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).transfer(beneficiaryAddress, INITIAL_POW1_SUPPLY);

    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant POW1 issuer role to POW1Staker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have POW1 issuer role on POW1Staker", async function (): Promise<void> {
    const { pow1TokenContract, pow1StakerContract } = contracts;

    // Check for issuer role
    const hasRole: boolean = await pow1TokenContract.hasRole(
      ERC20_ISSUER_ROLE,
      await pow1StakerContract.getAddress(),
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant POW1 issuer role to POW1Staker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, pow1StakerContract } = contracts;

    // Grant issuer role to POW1Staker
    const txStaker: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await pow1StakerContract.getAddress());

    // Check events
    const receipt: ContractTransactionReceipt | null = await txStaker.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await pow1TokenContract.getAddress());
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(ERC20_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(await pow1StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(await deployer.getAddress());
  });

  it("should have POW1 issuer role on POW1Staker", async function (): Promise<void> {
    const { pow1TokenContract, pow1StakerContract } = contracts;

    // Check for issuer role
    const hasRole: boolean = await pow1TokenContract.hasRole(
      ERC20_ISSUER_ROLE,
      await pow1StakerContract.getAddress(),
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant POW1 issuer role to POW5Staker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have POW1 issuer role on POW5Staker", async function (): Promise<void> {
    const { pow1TokenContract, pow5StakerContract } = contracts;

    // Check for issuer role
    const hasRole: boolean = await pow1TokenContract.hasRole(
      ERC20_ISSUER_ROLE,
      await pow5StakerContract.getAddress(),
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant POW1 issuer role to POW5Staker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, pow5StakerContract } = contracts;

    // Grant issuer role to pow5Staker
    const txStaker: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await pow5StakerContract.getAddress());

    // Check events
    const receipt: ContractTransactionReceipt | null = await txStaker.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await pow1TokenContract.getAddress());
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(ERC20_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(await pow5StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(await deployer.getAddress());
  });

  it("should have POW1 issuer role on POW5Staker", async function (): Promise<void> {
    const { pow1TokenContract, pow5StakerContract } = contracts;

    // Check for issuer role
    const hasRole: boolean = await pow1TokenContract.hasRole(
      ERC20_ISSUER_ROLE,
      await pow5StakerContract.getAddress(),
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT issuer role to POW1Staker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have LPSFT issuer role on POW1Staker", async function (): Promise<void> {
    const { lpSftContract, pow1StakerContract } = contracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      await pow1StakerContract.getAddress(),
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant LPSFT issuer role to POW1Staker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, pow1StakerContract } = contracts;

    // Grant issuer role
    const tx: ContractTransactionResponse = await (
      lpSftContract.connect(deployer) as Contract
    ).grantRole(LPSFT_ISSUER_ROLE, await pow1StakerContract.getAddress());

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await lpSftContract.getAddress());
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(LPSFT_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(await pow1StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(await deployer.getAddress());
  });

  it("should have LPSFT issuer role on POW1Staker", async function (): Promise<void> {
    const { lpSftContract, pow1StakerContract } = contracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      await pow1StakerContract.getAddress(),
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPSFT issuer role to POW5Staker
  //////////////////////////////////////////////////////////////////////////////

  it("should not have LPSFT issuer role on POW5Staker", async function (): Promise<void> {
    const { lpSftContract, pow5StakerContract } = contracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      await pow5StakerContract.getAddress(),
    );
    chai.expect(hasRole).to.be.false;
  });

  it("should grant LPSFT issuer role to POW5Staker", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, pow5StakerContract } = contracts;

    // Grant issuer role
    const tx: ContractTransactionResponse = await (
      lpSftContract.connect(deployer) as Contract
    ).grantRole(LPSFT_ISSUER_ROLE, await pow5StakerContract.getAddress());

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await lpSftContract.getAddress());
    chai.expect(log.fragment.name).to.equal("RoleGranted");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(LPSFT_ISSUER_ROLE);
    chai.expect(log.args[1]).to.equal(await pow5StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(await deployer.getAddress());
  });

  it("should have LPSFT issuer role on on POW5Staker", async function (): Promise<void> {
    const { lpSftContract, pow5StakerContract } = contracts;

    // Check for issuer role
    const hasRole: boolean = await lpSftContract.hasRole(
      LPSFT_ISSUER_ROLE,
      await pow5StakerContract.getAddress(),
    );
    chai.expect(hasRole).to.be.true;
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant ERC20 issuer role to LPSFT
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPPOW1 issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpPow1TokenContract, lpSftContract } = contracts;

    // Grant issuer role
    const tx: ContractTransactionResponse = await (
      lpPow1TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await lpSftContract.getAddress());
    await tx.wait();
  });

  it("should grant LPPOW5 issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpPow5TokenContract, lpSftContract } = contracts;

    // Grant issuer role
    const tx: ContractTransactionResponse = await (
      lpPow5TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await lpSftContract.getAddress());
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve spending POW1 reward for LPPOW1 staking incentive
  //////////////////////////////////////////////////////////////////////////////

  it("should approve spending POW1 for LPPOW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, pow1StakerContract } = contracts;

    // Approve POW1Staker spending POW1
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).approve(await pow1StakerContract.getAddress(), LPPOW1_REWARD_AMOUNT);

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await pow1TokenContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(await deployer.getAddress());
    chai.expect(log.args[1]).to.equal(await pow1StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(LPPOW1_REWARD_AMOUNT);
  });

  it("should check POW1 allowance for LPPOW1", async function (): Promise<void> {
    const { pow1TokenContract, pow1StakerContract } = contracts;

    // Check allowance
    const allowance: bigint = await pow1TokenContract.allowance(
      await deployer.getAddress(),
      await pow1StakerContract.getAddress(),
    );
    chai.expect(allowance).to.equal(LPPOW1_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve spending POW1 reward for LPPOW5 staking incentive
  //////////////////////////////////////////////////////////////////////////////

  it("should approve spending POW5 for LPPOW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, pow5StakerContract } = contracts;

    // Approve POW5Staker spending POW1
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).approve(await pow5StakerContract.getAddress(), LPPOW5_REWARD_AMOUNT);

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await pow1TokenContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(await deployer.getAddress());
    chai.expect(log.args[1]).to.equal(await pow5StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(LPPOW5_REWARD_AMOUNT);
  });

  it("should check POW1 allowance for LPPOW5", async function (): Promise<void> {
    const { pow1TokenContract, pow5StakerContract } = contracts;

    // Check allowance
    const allowance: bigint = await pow1TokenContract.allowance(
      await deployer.getAddress(),
      await pow5StakerContract.getAddress(),
    );
    chai.expect(allowance).to.equal(LPPOW5_REWARD_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create incentive for LPPOW1 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should create incentive for LPPOW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, pow1StakerContract } = contracts;

    // Create incentive
    const tx: ContractTransactionResponse = await (
      pow1StakerContract.connect(deployer) as Contract
    ).createIncentive(LPPOW1_REWARD_AMOUNT);

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.equal(5);

    // Loop through logs looking for IncentiveCreated event
    for (const log of logs) {
      if (log instanceof EventLog) {
        const eventLog: EventLog = log as EventLog;
        if (log.fragment.name === "IncentiveCreated") {
          // Found the event
          chai
            .expect(eventLog.address)
            .to.equal(await pow1StakerContract.getAddress());
          chai.expect(eventLog.args.length).to.equal(6);
          chai.expect(eventLog.args[0]).to.equal(await deployer.getAddress()); // creator
          chai
            .expect(eventLog.args[1])
            .to.equal(await pow1TokenContract.getAddress()); // rewardToken
          chai.expect(eventLog.args[2]).to.equal(LPPOW1_REWARD_AMOUNT); // rewardAmount
          chai.expect(parseInt(eventLog.args[3])).to.be.greaterThan(0); // startTime
          chai.expect(parseInt(eventLog.args[4])).to.be.greaterThan(0); // endTime
          //chai.expect(eventLog.args[5]).to.equal(await deployer.getAddress()); // TODO
        }
      }
    }
  });

  it("should check incentive for LPPOW1", async function (): Promise<void> {
    const { pow1StakerContract } = contracts;

    // Check incentive
    const incentive = await pow1StakerContract.getIncentive();
    chai.expect(incentive.length).to.equal(3);
    chai.expect(incentive[0]).to.equal(LPPOW1_REWARD_AMOUNT); // totalRewardUnclaimed
    chai.expect(incentive[1]).to.equal(0n); // totalSecondsClaimedX128
    chai.expect(incentive[2]).to.equal(0n); // numberOfStakes
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create incentive for LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should create incentive for LPPOW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, pow5StakerContract } = contracts;

    // Create incentive
    const tx: ContractTransactionResponse = await (
      pow5StakerContract.connect(deployer) as Contract
    ).createIncentive(LPPOW5_REWARD_AMOUNT);

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.equal(5);

    // Loop through logs looking for IncentiveCreated event
    for (const log of logs) {
      if (log instanceof EventLog) {
        const eventLog: EventLog = log as EventLog;
        if (log.fragment.name === "IncentiveCreated") {
          // Found the event
          chai
            .expect(eventLog.address)
            .to.equal(await pow5StakerContract.getAddress());
          chai.expect(eventLog.args.length).to.equal(6);
          chai.expect(eventLog.args[0]).to.equal(await deployer.getAddress()); // creator
          chai
            .expect(eventLog.args[1])
            .to.equal(await pow1TokenContract.getAddress()); // rewardToken
          chai.expect(eventLog.args[2]).to.equal(LPPOW5_REWARD_AMOUNT); // rewardAmount
          chai.expect(parseInt(eventLog.args[3])).to.be.greaterThan(0); // startTime
          chai.expect(parseInt(eventLog.args[4])).to.be.greaterThan(0); // endTime
          //chai.expect(eventLog.args[5]).to.equal(await deployer.getAddress()); // TODO
        }
      }
    }
  });

  it("should check incentive for LPPOW5", async function (): Promise<void> {
    const { pow5StakerContract } = contracts;

    // Check incentive
    const incentive = await pow5StakerContract.getIncentive();
    chai.expect(incentive.length).to.equal(3);
    chai.expect(incentive[0]).to.equal(LPPOW5_REWARD_AMOUNT); // totalRewardUnclaimed
    chai.expect(incentive[1]).to.equal(0n); // totalSecondsClaimedX128
    chai.expect(incentive[2]).to.equal(0n); // numberOfStakes
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPPOW1 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPPOW1", async function (): Promise<void> {
    const { pow1PoolerContract } = contracts;

    // Get pool token order
    pow1IsToken0 = await pow1PoolerContract.gameIsToken0();
    chai.expect(pow1IsToken0).to.be.a("boolean");

    console.log(`    POW1 is ${pow1IsToken0 ? "token0" : "token1"}`);
  });

  it("should initialize the LPPOW1 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1PoolContract } = contracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow1IsToken0 ? WETH_TOKEN_AMOUNT : INITIAL_POW1_SUPPLY,
      pow1IsToken0 ? INITIAL_POW1_SUPPLY : WETH_TOKEN_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const tx: ContractTransactionResponse =
      await pow1PoolContract.initialize(INITIAL_PRICE);

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.equal(1);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await pow1PoolContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Initialize");
    chai.expect(log.args.length).to.equal(2);
    chai.expect(log.args[0]).to.equal(INITIAL_PRICE);
    chai
      .expect(log.args[1])
      .to.equal(
        BigInt(
          pow1IsToken0 ? LPPOW1_INITIAL_TICK_LOW : LPPOW1_INITIAL_TICK_HIGH,
        ),
      );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPPOW5", async function (): Promise<void> {
    const { pow5PoolerContract } = contracts;

    // Get pool token order
    pow5IsToken0 = await pow5PoolerContract.gameIsToken0();
    chai.expect(pow5IsToken0).to.be.a("boolean");

    console.log(`    POW5 is ${pow5IsToken0 ? "token0" : "token1"}`);
  });

  it("should initialize the LPPOW5 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5PoolContract } = contracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow5IsToken0 ? USDC_TOKEN_AMOUNT : INITIAL_POW5_DEPOSIT,
      pow5IsToken0 ? INITIAL_POW5_DEPOSIT : USDC_TOKEN_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const tx: ContractTransactionResponse =
      await pow5PoolContract.initialize(INITIAL_PRICE);

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.equal(1);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await pow5PoolContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Initialize");
    chai.expect(log.args.length).to.equal(2);
    chai.expect(log.args[0]).to.equal(INITIAL_PRICE);
    chai
      .expect(log.args[1])
      .to.equal(
        BigInt(
          pow5IsToken0 ? LPPOW5_INITIAL_TICK_LOW : LPPOW5_INITIAL_TICK_HIGH,
        ),
      );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the LPPOW1 pool spending POW1 and WETH tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should check POW1 and WETH balances", async function (): Promise<void> {
    const { pow1TokenContract, wrappedNativeTokenContract } = contracts;

    // Check POW1 balance
    const pow1Balance: bigint =
      await pow1TokenContract.balanceOf(beneficiaryAddress);
    chai.expect(pow1Balance).to.equal(INITIAL_POW1_SUPPLY);

    // Check WETH balance
    const wethBalance: bigint =
      await wrappedNativeTokenContract.balanceOf(beneficiaryAddress);
    chai.expect(wethBalance).to.equal(WETH_TOKEN_AMOUNT);
  });

  it("should allow POW1Staker to spend POW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1StakerContract, pow1TokenContract } = contracts;

    // Approve POW1Staker spending POW1
    const tx: ContractTransactionResponse = await pow1TokenContract.approve(
      await pow1StakerContract.getAddress(),
      INITIAL_POW1_SUPPLY,
    );

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await pow1TokenContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(await pow1StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(INITIAL_POW1_SUPPLY);
  });

  it("should allow POW1Staker to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1StakerContract, wrappedNativeTokenContract } = contracts;

    // Approve POW1Staker spending WETH
    const tx: ContractTransactionResponse =
      await wrappedNativeTokenContract.approve(
        await pow1StakerContract.getAddress(),
        WETH_TOKEN_AMOUNT,
      );

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai
      .expect(log.address)
      .to.equal(await wrappedNativeTokenContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(await pow1StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(WETH_TOKEN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Stake POW1 and WETH tokens and mint LPPOW1 LP-NFT
  //////////////////////////////////////////////////////////////////////////////

  it("should mint POW1/WETH LP-NFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1StakerContract, uniswapV3NftManagerContract } = contracts;

    // Calculate DeFi metrics
    const pow1DepositAmount: number = parseInt(
      ethers.formatUnits(INITIAL_POW1_SUPPLY, POW1_DECIMALS),
    );
    const microWethDepositAmount: number = parseInt(
      ethers.formatEther(WETH_TOKEN_AMOUNT * 1_000_000n),
    );
    const pow1DepositValue: number = pow1DepositAmount * INITIAL_POW1_PRICE;
    const wethDepositValue: number =
      (microWethDepositAmount * ETH_PRICE) / 1_000_000.0; // TODO: Fix rounding

    // Log DeFi metrics
    console.log(
      `    Depositing: ${pow1DepositAmount.toLocaleString()} POW1 ($${pow1DepositValue.toLocaleString()})`,
    );
    console.log(
      `    Depositing: ${(
        microWethDepositAmount / 1_000_000.0
      ).toLocaleString()} ETH ($${wethDepositValue.toLocaleString()})`,
    );

    const mintTx: ContractTransactionResponse =
      await pow1StakerContract.stakeNFTImbalance(
        INITIAL_POW1_SUPPLY, // gameTokenAmount
        WETH_TOKEN_AMOUNT, // assetTokenAmount
        beneficiaryAddress, // recipient
      );

    const receipt: ContractTransactionReceipt | null = await mintTx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(19); // 20 events for perfectly balanced liquidity

    // Loop through logs looking for NFTStaked event
    for (const log of logs) {
      if (log instanceof EventLog) {
        const eventLog: EventLog = log as EventLog;
        if (log.fragment.name === "NFTStaked") {
          // Found the event
          chai
            .expect(eventLog.address)
            .to.equal(await pow1StakerContract.getAddress());
          chai.expect(eventLog.args.length).to.equal(4);
          chai.expect(eventLog.args[0]).to.equal(beneficiaryAddress); // sender
          chai.expect(eventLog.args[1]).to.equal(beneficiaryAddress); // recipient
          chai
            .expect(eventLog.args[2])
            .to.equal(await uniswapV3NftManagerContract.getAddress()); // nftAddress
          chai.expect(eventLog.args[3]).to.equal(POW1_LPNFT_TOKEN_ID); // nftTokenId
        }
      }
    }
  });

  it("should check LPPOW1 LP-NFT position", async function (): Promise<void> {
    const {
      pow1TokenContract,
      uniswapV3NftManagerContract,
      wrappedNativeTokenContract,
    } = contracts;

    // Calculate DeFi metrics
    const lpPow1Price: number = INITIAL_POW5_PRICE;
    const lpPow1Value: number = parseInt(
      ethers.formatUnits(
        INITIAL_LPPOW1_AMOUNT / BigInt(1 / lpPow1Price),
        LPPOW1_DECIMALS,
      ),
    );

    // Log DeFi metrics
    console.log(
      `    Minted: ${ethers
        .formatUnits(INITIAL_LPPOW1_AMOUNT, LPPOW1_DECIMALS)
        .toLocaleString()} LPPOW1 ($${lpPow1Value.toLocaleString()})`,
    );

    const positions: Result[] =
      await uniswapV3NftManagerContract.positions(POW1_LPNFT_TOKEN_ID);
    chai.expect(positions.length).to.equal(12);
    chai.expect(positions[0]).to.equal(0n); // nonce for permits
    chai.expect(positions[1]).to.equal(ZERO_ADDRESS); // operator
    chai
      .expect(positions[2])
      .to.equal(
        await (pow1IsToken0
          ? pow1TokenContract.getAddress()
          : wrappedNativeTokenContract.getAddress()),
      ); // token0
    chai
      .expect(positions[3])
      .to.equal(
        await (pow1IsToken0
          ? wrappedNativeTokenContract.getAddress()
          : pow1TokenContract.getAddress()),
      ); // token1
    chai.expect(positions[4]).to.equal(BigInt(LPPOW1_POOL_FEE)); // fee
    chai.expect(positions[5]).to.equal(BigInt(getMinTick(LPPOW1_POOL_FEE))); // tickLower
    chai.expect(positions[6]).to.equal(BigInt(getMaxTick(LPPOW1_POOL_FEE))); // tickUpper
    chai.expect(positions[7]).to.equal(INITIAL_LPPOW1_AMOUNT); // liquidity
    chai.expect(positions[8]).to.equal(0n); // feeGrowthInside0LastX128
    chai.expect(positions[9]).to.equal(0n); // feeGrowthInside1LastX128
    chai.expect(positions[10]).to.equal(0n); // tokensOwed0
    chai.expect(positions[11]).to.equal(0n); // tokensOwed1
  });

  it("should check POW1 balances", async function (): Promise<void> {
    const { pow1PoolContract, pow1TokenContract } = contracts;

    const beneficiaryBalance: bigint =
      await pow1TokenContract.balanceOf(beneficiaryAddress);
    chai.expect(beneficiaryBalance).to.equal(LPPOW1_POW1_DUST);

    // Log DeFi metrics
    console.log(
      `    Beneficiary POW1 dust: ${LPPOW1_POW1_DUST.toLocaleString()}`,
    );

    const pow1PoolBalance: bigint = await pow1TokenContract.balanceOf(
      await pow1PoolContract.getAddress(),
    );
    chai
      .expect(pow1PoolBalance)
      .to.equal(INITIAL_POW1_SUPPLY - LPPOW1_POW1_DUST);
  });

  it("should check WETH balances", async function (): Promise<void> {
    const { pow1PoolContract, wrappedNativeTokenContract } = contracts;

    const beneficiaryBalance: bigint =
      await wrappedNativeTokenContract.balanceOf(beneficiaryAddress);
    chai.expect(beneficiaryBalance).to.equal(LPPOW1_WETH_DUST);

    const pow1PoolBalance: bigint = await wrappedNativeTokenContract.balanceOf(
      await pow1PoolContract.getAddress(),
    );
    chai.expect(pow1PoolBalance).to.equal(WETH_TOKEN_AMOUNT - LPPOW1_WETH_DUST);
  });

  it("should check LPPOW1 LP-NFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = contracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);

    // Test ownerOf()
    const owner: string = await lpSftContract.ownerOf(POW1_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(beneficiaryAddress);

    // Test getTokenIds()
    const beneficiaryTokenIds: bigint[] =
      await lpSftContract.getTokenIds(beneficiaryAddress);
    chai.expect(beneficiaryTokenIds.length).to.equal(1);
    chai.expect(beneficiaryTokenIds[0]).to.equal(POW1_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(POW1_LPNFT_TOKEN_ID);

    // Check that data URI has correct mime type
    chai.expect(nftTokenUri).to.match(/data:application\/json;base64,.+/);

    // Content should be valid JSON and structure
    const nftContent = extractJSONFromURI(nftTokenUri);
    if (!nftContent) {
      throw new Error("Failed to extract JSON from URI");
    }
    chai.expect(nftContent).to.haveOwnProperty("name").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("description").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("image").is.a("string");

    if (DEBUG_PRINT_NFT_IMAGE) {
      console.log(`    NFT image: ${nftContent.image}`);
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Mint POW5 for testing
  //////////////////////////////////////////////////////////////////////////////

  it("should grant POW5 issuer role", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5TokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await tx.wait();
  });

  it("should mint POW5 to beneficiary for testing", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5TokenContract } = contracts;

    // Mint POW5
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as Contract
    ).mint(beneficiaryAddress, INITIAL_POW5_DEPOSIT);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the LPPOW5 pool spending POW5 and USDC tokens
  //////////////////////////////////////////////////////////////////////////////

  it("should check POW5 and USDC balances", async function (): Promise<void> {
    const { pow5TokenContract, usdcTokenContract } = contracts;

    // Check POW5 balance
    const pow5Balance: bigint =
      await pow5TokenContract.balanceOf(beneficiaryAddress);
    chai.expect(pow5Balance).to.equal(INITIAL_POW5_DEPOSIT);

    // Check USDC balance
    const usdcBalance: bigint =
      await usdcTokenContract.balanceOf(beneficiaryAddress);
    chai.expect(usdcBalance).to.equal(USDC_TOKEN_AMOUNT);
  });

  it("should allow POW5Staker to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5StakerContract, pow5TokenContract } = contracts;

    // Approve POW5Staker spending POW5
    const tx: ContractTransactionResponse = await pow5TokenContract.approve(
      await pow5StakerContract.getAddress(),
      INITIAL_POW5_DEPOSIT,
    );

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await pow5TokenContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(await pow5StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(INITIAL_POW5_DEPOSIT);
  });

  it("should allow POW5Staker to spend USDC", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5StakerContract, usdcTokenContract } = contracts;

    // Approve POW5Staker spending USDC
    const tx: ContractTransactionResponse = await usdcTokenContract.approve(
      await pow5StakerContract.getAddress(),
      USDC_TOKEN_AMOUNT,
    );

    // Check events
    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await usdcTokenContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Approval");
    chai.expect(log.args.length).to.equal(3);
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(await pow5StakerContract.getAddress());
    chai.expect(log.args[2]).to.equal(USDC_TOKEN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Deposit POW5 and USDC tokens and mint LPPOW5 LP-NFT
  //////////////////////////////////////////////////////////////////////////////

  it("should mint POW5/USDC LP-NFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5StakerContract, uniswapV3NftManagerContract } = contracts;

    // Calculate DeFi properties
    const pow5Value: string = ethers.formatUnits(
      INITIAL_POW5_DEPOSIT / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      USDC_TOKEN_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log DeFi metrics
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_POW5_DEPOSIT,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value.toLocaleString()})`,
    );
    console.log(
      `    Depositing: ${ethers.formatUnits(
        USDC_TOKEN_AMOUNT,
        USDC_DECIMALS,
      )} USDC ($${usdcValue.toLocaleString()})`,
    );

    const mintTx: ContractTransactionResponse =
      await pow5StakerContract.stakeNFTImbalance(
        INITIAL_POW5_DEPOSIT, // gameTokenAmount
        USDC_TOKEN_AMOUNT, // assetTokenAmount
        beneficiaryAddress, // recipient
      );

    const receipt: ContractTransactionReceipt | null = await mintTx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(19); // 20 events for perfectly balanced liquidity

    // Loop through logs looking for NFTStaked event
    for (const log of logs) {
      if (log instanceof EventLog) {
        const eventLog: EventLog = log as EventLog;
        if (log.fragment.name === "NFTStaked") {
          // Found the event
          chai
            .expect(eventLog.address)
            .to.equal(await pow5StakerContract.getAddress());
          chai.expect(eventLog.args.length).to.equal(4);
          chai.expect(eventLog.args[0]).to.equal(beneficiaryAddress); // sender
          chai.expect(eventLog.args[1]).to.equal(beneficiaryAddress); // recipient
          chai
            .expect(eventLog.args[2])
            .to.equal(await uniswapV3NftManagerContract.getAddress()); // nftAddress
          chai.expect(eventLog.args[3]).to.equal(POW5_LPNFT_TOKEN_ID); // nftTokenId
        }
      }
    }
  });

  it("should check LPPOW5 LP-NFT position", async function (): Promise<void> {
    const {
      pow5TokenContract,
      uniswapV3NftManagerContract,
      usdcTokenContract,
    } = contracts;

    /*
    // Calculate DeFi metrics
    const lpPow1Price: number = INITIAL_POW5_PRICE;
    const lpPow1Value: number = parseInt(
      ethers.formatUnits(
        (INITIAL_LPPOW1_AMOUNT * 1n) / BigInt(1 / lpPow1Price),
        LPPOW1_DECIMALS,
      ),
    );
    */

    // Log DeFi metrics
    console.log(
      `    Minted: ${ethers
        .formatUnits(INITIAL_LPPOW5_AMOUNT, LPPOW5_DECIMALS)
        .toLocaleString()} LPPOW5`,
    );

    const positions: Result[] =
      await uniswapV3NftManagerContract.positions(POW5_LPNFT_TOKEN_ID);
    chai.expect(positions.length).to.equal(12);
    chai.expect(positions[0]).to.equal(0n); // nonce for permits
    chai.expect(positions[1]).to.equal(ZERO_ADDRESS); // operator
    chai
      .expect(positions[2])
      .to.equal(
        await (pow5IsToken0
          ? pow5TokenContract.getAddress()
          : usdcTokenContract.getAddress()),
      ); // token0
    chai
      .expect(positions[3])
      .to.equal(
        await (pow5IsToken0
          ? usdcTokenContract.getAddress()
          : pow5TokenContract.getAddress()),
      ); // token1
    chai.expect(positions[4]).to.equal(BigInt(LPPOW5_POOL_FEE)); // fee
    chai.expect(positions[5]).to.equal(BigInt(getMinTick(LPPOW5_POOL_FEE))); // tickLower
    chai.expect(positions[6]).to.equal(BigInt(getMaxTick(LPPOW5_POOL_FEE))); // tickUpper
    chai.expect(positions[7]).to.equal(INITIAL_LPPOW5_AMOUNT); // liquidity
    chai.expect(positions[8]).to.equal(0n); // feeGrowthInside0LastX128
    chai.expect(positions[9]).to.equal(0n); // feeGrowthInside1LastX128
    chai.expect(positions[10]).to.equal(0n); // tokensOwed0
    chai.expect(positions[11]).to.equal(0n); // tokensOwed1
  });

  it("should check POW5 balances", async function (): Promise<void> {
    const { pow5PoolContract, pow5TokenContract } = contracts;

    const beneficiaryBalance: bigint =
      await pow5TokenContract.balanceOf(beneficiaryAddress);
    chai.expect(beneficiaryBalance).to.equal(LPPOW5_POW5_DUST);

    // Log DeFi metrics
    console.log(
      `    Beneficiary POW5 dust: ${LPPOW5_POW5_DUST.toLocaleString()}`,
    );

    const pow5PoolBalance: bigint = await pow5TokenContract.balanceOf(
      await pow5PoolContract.getAddress(),
    );
    chai
      .expect(pow5PoolBalance)
      .to.equal(INITIAL_POW5_DEPOSIT - LPPOW5_POW5_DUST);
  });

  it("should check USDC balances", async function (): Promise<void> {
    const { pow5PoolContract, usdcTokenContract } = contracts;

    const beneficiaryBalance: bigint =
      await usdcTokenContract.balanceOf(beneficiaryAddress);
    chai.expect(beneficiaryBalance).to.equal(LPPOW5_USDC_DUST);

    const pow5PoolBalance: bigint = await usdcTokenContract.balanceOf(
      await pow5PoolContract.getAddress(),
    );
    chai.expect(pow5PoolBalance).to.equal(USDC_TOKEN_AMOUNT - LPPOW5_USDC_DUST);
  });

  it("should check POW5 LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = contracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);

    // Test ownerOf()
    const owner: string = await lpSftContract.ownerOf(POW5_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(beneficiaryAddress);

    // Test getTokenIds()
    const beneficiaryTokenIds: bigint[] =
      await lpSftContract.getTokenIds(beneficiaryAddress);
    chai.expect(beneficiaryTokenIds.length).to.equal(2);
    chai.expect(beneficiaryTokenIds[0]).to.equal(POW1_LPNFT_TOKEN_ID);
    chai.expect(beneficiaryTokenIds[1]).to.equal(POW5_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(POW5_LPNFT_TOKEN_ID);

    // Check that data URI has correct mime type
    chai.expect(nftTokenUri).to.match(/data:application\/json;base64,.+/);

    // Content should be valid JSON and structure
    const nftContent = extractJSONFromURI(nftTokenUri);
    if (!nftContent) {
      throw new Error("Failed to extract JSON from URI");
    }
    chai.expect(nftContent).to.haveOwnProperty("name").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("description").is.a("string");
    chai.expect(nftContent).to.haveOwnProperty("image").is.a("string");

    if (DEBUG_PRINT_NFT_IMAGE) {
      console.log(`    NFT image: ${nftContent.image}`);
    }
  });
});

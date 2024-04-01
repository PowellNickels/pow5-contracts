/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai, { AssertionError } from "chai";
import { Contract, ContractTransactionResponse, ethers } from "ethers";
import * as hardhat from "hardhat";

import { ContractLibraryEthers } from "../../src/interfaces/contractLibraryEthers";
import { setupFixture } from "../../src/testing/setupFixture";
import { POW1_DECIMALS } from "../../src/utils/constants";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Amount of POW1 to give to the stake farm for rewards
const POW1_REWARD_AMOUNT: bigint = ethers.parseUnits("10000", 18); // 10,000 POW1

// Amount of POW5 to stake in the stake farm
const POW5_LOAN_AMOUNT: bigint = ethers.parseUnits("100", 18); // 100 POW5

// Duration of time to stake POW5
const POW5_LOAN_DURATION: number = 10 * 60; // 10 minutes

// Amount of POW1 to yield from staking POW5
const POW1_YIELD_AMOUNT: bigint =
  ethers.parseUnits("1", 18) * BigInt(POW5_LOAN_DURATION); // 600 POW1

//
// Test cases
//

describe("ERC20 Interest Farm", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture Constants
  //////////////////////////////////////////////////////////////////////////////

  const ERC20_ISSUER_ROLE: string =
    ethers.encodeBytes32String("ERC20_ISSUER_ROLE");
  const ERC20_FARM_OPERATOR_ROLE: string = ethers.encodeBytes32String(
    "ERC20_FARM_OPERATOR_ROLE",
  );

  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let beneficiaryAddress: string;
  let contracts: ContractLibraryEthers;

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
  // Test setup: Mint tokens
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

  it("should grant POW5 issuer role to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5TokenContract } = contracts;

    // Grant issuer role to deployer
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await tx.wait();
  });

  it("should mint POW1 reward", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, pow5InterestFarmContract } = contracts;

    // Mint POW1
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).mint(await pow5InterestFarmContract.getAddress(), POW1_REWARD_AMOUNT);
    await tx.wait();
  });

  it("should mint POW5 principal", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5TokenContract } = contracts;

    // Mint POW5
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as Contract
    ).mint(beneficiaryAddress, POW5_LOAN_AMOUNT);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant ERC20_FARM_OPERATOR_ROLE to beneficiary
  //////////////////////////////////////////////////////////////////////////////

  it("should grant ERC20_FARM_OPERATOR_ROLE to beneficiary", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5InterestFarmContract } = contracts;

    // Approve POW1Staker spending POW1
    const tx: ContractTransactionResponse = await (
      pow5InterestFarmContract.connect(deployer) as Contract
    ).grantRole(ERC20_FARM_OPERATOR_ROLE, beneficiaryAddress);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the interest farm spending POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should allow interest farm to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5TokenContract, pow5InterestFarmContract } = contracts;

    // Approve POW1Staker spending POW1
    const tx: ContractTransactionResponse = await pow5TokenContract.approve(
      await pow5InterestFarmContract.getAddress(),
      POW5_LOAN_AMOUNT,
    );
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Stake POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should check empty interest farm", async function () {
    const { pow5InterestFarmContract } = contracts;

    const totalLiquidity: bigint =
      await pow5InterestFarmContract.totalLiquidity();
    chai.expect(totalLiquidity).to.equal(0n);
  });

  it("should loan POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5InterestFarmContract } = contracts;

    const tx: ContractTransactionResponse =
      await pow5InterestFarmContract.recordLoan(
        beneficiaryAddress,
        POW5_LOAN_AMOUNT,
      );
    await tx.wait();
  });

  it("should check balance", async function (): Promise<void> {
    const { pow5InterestFarmContract } = contracts;

    const balanceAmount: bigint =
      await pow5InterestFarmContract.balanceOf(beneficiaryAddress);
    chai.expect(balanceAmount).to.equal(POW5_LOAN_AMOUNT);
  });

  it("should check total loaned", async function () {
    const { pow5InterestFarmContract } = contracts;

    const totalLiquidity: bigint =
      await pow5InterestFarmContract.totalLiquidity();
    chai.expect(totalLiquidity).to.equal(POW5_LOAN_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Advance time and check reward
  //////////////////////////////////////////////////////////////////////////////

  it("should check for no staking reward", async function (): Promise<void> {
    const { pow5InterestFarmContract } = contracts;

    const rewardAmount: bigint =
      await pow5InterestFarmContract.earned(beneficiaryAddress);
    chai.expect(rewardAmount).to.equal(0n);
  });

  it("should advance time 10 minutes", async function () {
    // Increase the time 10 minutes
    await hardhat.network.provider.request({
      method: "evm_increaseTime",
      params: [POW5_LOAN_DURATION],
    });

    // Mine the next block
    await hardhat.network.provider.request({
      method: "evm_mine",
      params: [],
    });
  });

  it("should check staking reward", async function (): Promise<void> {
    const { pow5InterestFarmContract } = contracts;

    const rewardAmount: bigint =
      await pow5InterestFarmContract.earned(beneficiaryAddress);

    try {
      chai.expect(rewardAmount).to.equal(POW1_YIELD_AMOUNT);
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        // Handle small delay causing accrual of additional POW1
        chai.expect(rewardAmount).to.equal(POW1_YIELD_AMOUNT + 1n);
      }
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Claim reward
  //////////////////////////////////////////////////////////////////////////////

  it("should claim reward", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5InterestFarmContract } = contracts;

    const tx: ContractTransactionResponse =
      await pow5InterestFarmContract.claimReward(beneficiaryAddress);
    await tx.wait();
  });

  it("should check POW1 balances", async function () {
    const { pow1TokenContract, pow5InterestFarmContract } = contracts;

    const beneficiaryBalance: bigint =
      await pow1TokenContract.balanceOf(beneficiaryAddress);

    try {
      // Add 1 second of POW1
      chai
        .expect(beneficiaryBalance)
        .to.equal(POW1_YIELD_AMOUNT + ethers.parseUnits("1", POW1_DECIMALS));
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        // Add 2 seconds of POW1
        chai
          .expect(beneficiaryBalance)
          .to.equal(POW1_YIELD_AMOUNT + ethers.parseUnits("2", POW1_DECIMALS));
      }
    }

    const remainingBalance: bigint = await pow1TokenContract.balanceOf(
      await pow5InterestFarmContract.getAddress(),
    );

    try {
      // Subtract 1 second of POW1
      chai
        .expect(remainingBalance)
        .to.equal(
          POW1_REWARD_AMOUNT -
            POW1_YIELD_AMOUNT -
            ethers.parseUnits("1", POW1_DECIMALS),
        );
    } catch (error: unknown) {
      if (error instanceof AssertionError) {
        // Subtract 2 seconds of POW1
        chai
          .expect(remainingBalance)
          .to.equal(
            POW1_REWARD_AMOUNT -
              POW1_YIELD_AMOUNT -
              ethers.parseUnits("2", POW1_DECIMALS),
          );
      }
    }
  });
});

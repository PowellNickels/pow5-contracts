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
  ContractTransactionReceipt,
  ContractTransactionResponse,
  ethers,
  EventLog,
  Log,
} from "ethers";
import * as hardhat from "hardhat";

import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { setupFixture } from "../../src/testing/setupFixture";
import { getAddressBook } from "../../src/utils/getAddressBook";
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

const DEPOSIT_AMOUNT: bigint = ethers.parseEther("1");

//
// Test cases
//

describe("W-ETH", () => {
  let contracts: ContractLibrary;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use ethers to get the accounts
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    const beneficiary: SignerWithAddress = signers[1];

    // A single fixture is used for the test suite
    await setupTest();

    // Get address book
    const addressBook: AddressBook = await getAddressBook(hardhat.network.name);

    // Get contract library
    contracts = getContractLibrary(beneficiary, addressBook);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test deposit
  //////////////////////////////////////////////////////////////////////////////

  it("should deposit ETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = contracts;

    // Perform deposit
    const tx: ContractTransactionResponse = await wrappedNativeContract.deposit(
      { value: DEPOSIT_AMOUNT },
    );

    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await wrappedNativeContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Deposit");
    chai.expect(log.args.length).to.equal(2);
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(DEPOSIT_AMOUNT);
  });

  it("should check balance", async function (): Promise<void> {
    const { wrappedNativeContract } = contracts;

    // Check balance
    const balance: bigint =
      await wrappedNativeContract.balanceOf(beneficiaryAddress);
    chai.expect(balance).to.equal(DEPOSIT_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test withdraw
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw ETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = contracts;

    // Perform withdraw
    const tx: ContractTransactionResponse =
      await wrappedNativeContract.withdraw(DEPOSIT_AMOUNT);

    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.address).to.equal(await wrappedNativeContract.getAddress());
    chai.expect(log.fragment.name).to.equal("Withdrawal");
    chai.expect(log.args.length).to.equal(2);
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(DEPOSIT_AMOUNT);
  });

  it("should check zero balance", async function (): Promise<void> {
    const { wrappedNativeContract } = contracts;

    // Check balance
    const balance: bigint =
      await wrappedNativeContract.balanceOf(beneficiaryAddress);
    chai.expect(balance).to.equal(0n);
  });
});

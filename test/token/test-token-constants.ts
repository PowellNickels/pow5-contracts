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
import { Signer } from "ethers";
import * as hardhat from "hardhat";

import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_POW1_SUPPLY,
  LPPOW1_DECIMALS,
  LPPOW5_DECIMALS,
  NOPOW5_DECIMALS,
  POW1_DECIMALS,
  POW5_DECIMALS,
} from "../../src/utils/constants";
import { getAddressBook } from "../../src/utils/getAddressBook";
import { getContractLibrary } from "../../src/utils/getContractLibrary";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test cases
//

describe("Token Constants", () => {
  let contracts: ContractLibrary;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function () {
    this.timeout(60 * 1000);

    // Use ethers to get the accounts
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    const deployer: Signer = signers[0];

    // A single fixture is used for the test suite
    await setupTest();

    // Get address book
    const addressBook: AddressBook = await getAddressBook(hardhat.network.name);

    // Get the contracts
    contracts = getContractLibrary(deployer, addressBook);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test token decimals
  //////////////////////////////////////////////////////////////////////////////

  it("should test POW1 decimals", async function () {
    const { pow1Contract } = contracts;

    const pow1Decimals: bigint = await pow1Contract.decimals();
    chai.expect(pow1Decimals).to.equal(BigInt(POW1_DECIMALS));
  });

  it("should test POW5 decimals", async function () {
    const { pow5Contract } = contracts;

    const pow5Decimals: bigint = await pow5Contract.decimals();
    chai.expect(pow5Decimals).to.equal(BigInt(POW5_DECIMALS));
  });

  it("should test LPPOW1 decimals", async function () {
    const { lpPow1Contract } = contracts;

    const lpPow1Decimals: bigint = await lpPow1Contract.decimals();
    chai.expect(lpPow1Decimals).to.equal(BigInt(LPPOW1_DECIMALS));
  });

  it("should test LPPOW5 decimals", async function () {
    const { lpPow5Contract } = contracts;

    const lpPow5Decimals: bigint = await lpPow5Contract.decimals();
    chai.expect(lpPow5Decimals).to.equal(BigInt(LPPOW5_DECIMALS));
  });

  it("should test NOPOW5 decimals", async function () {
    const { noPow5Contract } = contracts;

    const noPow5Decimals: bigint = await noPow5Contract.decimals();
    chai.expect(noPow5Decimals).to.equal(BigInt(NOPOW5_DECIMALS));
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test initial supply
  //////////////////////////////////////////////////////////////////////////////

  it("should test POW1 initial supply", async function () {
    const { pow1Contract } = contracts;

    const pow1Supply: bigint = await pow1Contract.totalSupply();
    chai.expect(pow1Supply).to.equal(INITIAL_POW1_SUPPLY);
  });

  it("should test POW5 initial supply", async function () {
    const { pow5Contract } = contracts;

    const pow5Supply: bigint = await pow5Contract.totalSupply();
    chai.expect(pow5Supply).to.equal(0n);
  });

  it("should test LPPOW1 initial supply", async function () {
    const { lpPow1Contract } = contracts;

    const lpPow1Supply: bigint = await lpPow1Contract.totalSupply();
    chai.expect(lpPow1Supply).to.equal(0n);
  });

  it("should test LPPOW5 initial supply", async function () {
    const { lpPow5Contract } = contracts;

    const lpPow5Supply: bigint = await lpPow5Contract.totalSupply();
    chai.expect(lpPow5Supply).to.equal(0n);
  });

  it("should test NOPOW5 initial supply", async function () {
    const { noPow5Contract } = contracts;

    const noPow5Supply: bigint = await noPow5Contract.totalSupply();
    chai.expect(noPow5Supply).to.equal(0n);
  });
});

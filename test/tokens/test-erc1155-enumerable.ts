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

import chai from "chai";
import {
  ContractTransactionReceipt,
  ContractTransactionResponse,
  EventLog,
  Log,
} from "ethers";
import * as hardhat from "hardhat";

import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { setupFixture } from "../../src/testing/setupFixture";
import { ZERO_ADDRESS } from "../../src/utils/constants";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

const nftTokenId1: bigint = 0n;
const nftTokenId2: bigint = 666n;
const nftTokenId3: bigint = 42n;
const nftTokenIdNonexistent: bigint = 999n;

//
// Test cases
//

describe("ERC1155Enumerable", () => {
  let deployerAddress: string;
  let beneficiaryAddress: string;
  let contracts: ContractLibrary;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function () {
    this.timeout(60 * 1000);

    // Get the wallet addresses
    const accounts: string[] = await hardhat.getUnnamedAccounts();
    deployerAddress = accounts[0];
    beneficiaryAddress = accounts[1];

    // A single fixture is used for the test suite
    contracts = await setupTest();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint single NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should check total supply with no tokens", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const totalSupply: bigint =
      await testErc1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(0n);
  });

  it("should mint first NFT", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Mint NFT
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.mintNFT(
        beneficiaryAddress,
        nftTokenId1,
      );

    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferSingle");
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(ZERO_ADDRESS);
    chai.expect(log.args[2]).to.equal(beneficiaryAddress);
    chai.expect(log.args[3]).to.equal(nftTokenId1);
    chai.expect(log.args[4]).to.equal(1n);
  });

  it("should check NFT balance", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const nftBalance: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId1,
    );
    chai.expect(nftBalance).to.equal(1n);
  });

  it("should check total supply with one token", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const totalSupply: bigint =
      await testErc1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);
  });

  it("should mint second NFT", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Mint NFT
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.mintNFT(
        beneficiaryAddress,
        nftTokenId2,
      );
    await tx.wait();
  });

  it("should check NFT balance", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const nftBalance: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId2,
    );
    chai.expect(nftBalance).to.equal(1n);
  });

  it("should check total supply with two tokens", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const totalSupply: bigint =
      await testErc1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Burn single NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should burn first NFT", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Burn NFT
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.burnNFT(
        beneficiaryAddress,
        nftTokenId1,
      );

    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferSingle");
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(beneficiaryAddress);
    chai.expect(log.args[2]).to.equal(ZERO_ADDRESS);
    chai.expect(log.args[3]).to.equal(nftTokenId1);
    chai.expect(log.args[4]).to.equal(1n);
  });

  it("should check NFT balance", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const nftBalance: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId1,
    );
    chai.expect(nftBalance).to.equal(0n);
  });

  it("should check total supply with one token", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const totalSupply: bigint =
      await testErc1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);
  });

  it("should burn second NFT", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Burn NFT
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.burnNFT(
        beneficiaryAddress,
        nftTokenId2,
      );
    await tx.wait();
  });

  it("should check NFT balance", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const nftBalance: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId2,
    );
    chai.expect(nftBalance).to.equal(0n);
  });

  it("should check total supply with no tokens", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const totalSupply: bigint =
      await testErc1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint multiple NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should batch mint two NFTs", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Use tokens with ID 3 and 1 to verify correct sorting later
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.batchMintNFT(beneficiaryAddress, [
        nftTokenId3,
        nftTokenId1,
      ]);

    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferBatch");
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(ZERO_ADDRESS);
    chai.expect(log.args[2]).to.equal(beneficiaryAddress);
    chai.expect(log.args[3].length).to.equal(2);
    chai.expect(log.args[3][0]).to.equal(nftTokenId3);
    chai.expect(log.args[3][1]).to.equal(nftTokenId1);
    chai.expect(log.args[4].length).to.equal(2);
    chai.expect(log.args[4][0]).to.equal(1n);
    chai.expect(log.args[4][1]).to.equal(1n);
  });

  it("should check NFT balance", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const nftBalance1: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId3,
    );
    chai.expect(nftBalance1).to.equal(1n);

    const nftBalance2: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId1,
    );
    chai.expect(nftBalance2).to.equal(1n);
  });

  it("should check total supply with two tokens", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const totalSupply: bigint =
      await testErc1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Burn multiple NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should batch burn two NFTs", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Burn NFTs
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.batchBurnNFT(beneficiaryAddress, [
        nftTokenId3,
        nftTokenId1,
      ]);

    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferBatch");
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(beneficiaryAddress);
    chai.expect(log.args[2]).to.equal(ZERO_ADDRESS);
    chai.expect(log.args[3].length).to.equal(2);
    chai.expect(log.args[3][0]).to.equal(nftTokenId3);
    chai.expect(log.args[3][1]).to.equal(nftTokenId1);
    chai.expect(log.args[4].length).to.equal(2);
    chai.expect(log.args[4][0]).to.equal(1n);
    chai.expect(log.args[4][1]).to.equal(1n);
  });

  it("should check NFT balance", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const nftBalance3: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId3,
    );
    chai.expect(nftBalance3).to.equal(0n);

    const nftBalance1: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId1,
    );
    chai.expect(nftBalance1).to.equal(0n);
  });

  it("should check total supply with no tokens", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    const totalSupply: bigint =
      await testErc1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Transfer NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should mint two NFTs", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Mint NFTs
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.batchMintNFT(beneficiaryAddress, [
        nftTokenId3,
        nftTokenId1,
      ]);
    await tx.wait();
  });

  it("should transfer both NFTs", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Transfer NFTs
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.safeBatchTransferFrom(
        beneficiaryAddress,
        deployerAddress,
        [nftTokenId3, nftTokenId1],
        [1, 1],
        "0x",
      );

    const receipt: ContractTransactionReceipt | null = await tx.wait();
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferBatch");
    chai.expect(log.args[0]).to.equal(beneficiaryAddress);
    chai.expect(log.args[1]).to.equal(beneficiaryAddress);
    chai.expect(log.args[2]).to.equal(deployerAddress);
    chai.expect(log.args[3].length).to.equal(2);
    chai.expect(log.args[3][0]).to.equal(nftTokenId3);
    chai.expect(log.args[3][1]).to.equal(nftTokenId1);
    chai.expect(log.args[4].length).to.equal(2);
    chai.expect(log.args[4][0]).to.equal(1n);
    chai.expect(log.args[4][1]).to.equal(1n);
  });

  it("should check beneficiary NFT balance", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const nftBalance1: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId3,
    );
    chai.expect(nftBalance1).to.equal(0n);

    const nftBalance2: bigint = await testErc1155EnumerableContract.balanceOf(
      beneficiaryAddress,
      nftTokenId1,
    );
    chai.expect(nftBalance2).to.equal(0n);
  });

  it("should check deployer NFT balance", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const nftBalance1: bigint = await testErc1155EnumerableContract.balanceOf(
      deployerAddress,
      nftTokenId3,
    );
    chai.expect(nftBalance1).to.equal(1n);

    const nftBalance2: bigint = await testErc1155EnumerableContract.balanceOf(
      deployerAddress,
      nftTokenId1,
    );
    chai.expect(nftBalance2).to.equal(1n);
  });

  it("should check total supply after transfer", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const totalSupply: bigint =
      await testErc1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test ownerOf()
  //////////////////////////////////////////////////////////////////////////////

  it("should mint third NFT", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Mint NFT
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.mintNFT(
        beneficiaryAddress,
        nftTokenId2,
      );
    await tx.wait();
  });

  it("should return the correct owner for an existing NFT", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const owner: string =
      await testErc1155EnumerableContract.ownerOf(nftTokenId2);
    chai.expect(owner).to.equal(beneficiaryAddress);
  });

  it("should check nonexistent token ID", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const owner: string = await testErc1155EnumerableContract.ownerOf(
      nftTokenIdNonexistent,
    );
    chai.expect(owner).to.equal(ZERO_ADDRESS);
  });

  it("should transfer third NFT", async function () {
    this.timeout(60 * 1000);

    const { testErc1155EnumerableContract } = contracts;

    // Transfer NFT
    const tx: ContractTransactionResponse =
      await testErc1155EnumerableContract.safeTransferFrom(
        beneficiaryAddress,
        deployerAddress,
        nftTokenId2,
        1,
        "0x",
      );
    await tx.wait();
  });

  it("should return the correct owner after transfer", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const owner: string =
      await testErc1155EnumerableContract.ownerOf(nftTokenId3);
    chai.expect(owner).to.equal(deployerAddress);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test getTokenIds()
  //////////////////////////////////////////////////////////////////////////////

  it("should return all token IDs", async function () {
    const { testErc1155EnumerableContract } = contracts;

    const beneficiaryTokenIds: bigint[] =
      await testErc1155EnumerableContract.getTokenIds(beneficiaryAddress);
    chai.expect(beneficiaryTokenIds.length).to.equal(0);

    const deployerTokenIds: bigint[] =
      await testErc1155EnumerableContract.getTokenIds(deployerAddress);
    chai.expect(deployerTokenIds.length).to.equal(3);
    chai.expect(deployerTokenIds[0]).to.equal(nftTokenId3);
    chai.expect(deployerTokenIds[1]).to.equal(nftTokenId1);
    chai.expect(deployerTokenIds[2]).to.equal(nftTokenId2);
  });
});

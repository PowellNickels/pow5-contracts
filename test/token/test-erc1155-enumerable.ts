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
import { ContractTransactionReceipt, EventLog, Log } from "ethers";
import * as hardhat from "hardhat";

import { TestERC1155EnumerableContract } from "../../src/contracts/test/token/erc1155/extensions/testErc1155EnumerableContract";
import { getAddressBook } from "../../src/hardhat/getAddressBook";
import { AddressBook } from "../../src/interfaces/addressBook";
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
  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let testERC1155EnumerableContract: TestERC1155EnumerableContract;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use ethers to get the account
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];
    beneficiary = signers[1];

    // A single fixture is used for the test suite
    await setupTest();

    // Get address book
    const addressBook: AddressBook = await getAddressBook(hardhat.network.name);

    // Create the contract
    testERC1155EnumerableContract = new TestERC1155EnumerableContract(
      beneficiary,
      addressBook.testErc1155Enumerable!,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint single NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should check total supply with no tokens", async function () {
    const totalSupply: bigint =
      await testERC1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(0n);
  });

  it("should mint first NFT", async function () {
    this.timeout(60 * 1000);

    // Mint NFT
    const receipt: ContractTransactionReceipt =
      await testERC1155EnumerableContract.mintNFT(
        await beneficiary.getAddress(),
        nftTokenId1,
      );
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferSingle");
    chai.expect(log.args[0]).to.equal(await beneficiary.getAddress());
    chai.expect(log.args[1]).to.equal(ZERO_ADDRESS);
    chai.expect(log.args[2]).to.equal(await beneficiary.getAddress());
    chai.expect(log.args[3]).to.equal(nftTokenId1);
    chai.expect(log.args[4]).to.equal(1n);
  });

  it("should check NFT balance", async function () {
    const nftBalance: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId1,
    );
    chai.expect(nftBalance).to.equal(1n);
  });

  it("should check total supply with one token", async function () {
    const totalSupply: bigint =
      await testERC1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);
  });

  it("should mint second NFT", async function () {
    this.timeout(60 * 1000);

    // Mint NFT
    await testERC1155EnumerableContract.mintNFT(
      await beneficiary.getAddress(),
      nftTokenId2,
    );
  });

  it("should check NFT balance", async function () {
    this.timeout(60 * 1000);

    const nftBalance: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId2,
    );
    chai.expect(nftBalance).to.equal(1n);
  });

  it("should check total supply with two tokens", async function () {
    this.timeout(60 * 1000);

    const totalSupply: bigint =
      await testERC1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Burn single NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should burn first NFT", async function () {
    this.timeout(60 * 1000);

    const receipt: ContractTransactionReceipt =
      await testERC1155EnumerableContract.burnNFT(
        await beneficiary.getAddress(),
        nftTokenId1,
      );
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferSingle");
    chai.expect(log.args[0]).to.equal(await beneficiary.getAddress());
    chai.expect(log.args[1]).to.equal(await beneficiary.getAddress());
    chai.expect(log.args[2]).to.equal(ZERO_ADDRESS);
    chai.expect(log.args[3]).to.equal(nftTokenId1);
    chai.expect(log.args[4]).to.equal(1n);
  });

  it("should check NFT balance", async function () {
    this.timeout(60 * 1000);

    const nftBalance: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId1,
    );
    chai.expect(nftBalance).to.equal(0n);
  });

  it("should check total supply with one token", async function () {
    this.timeout(60 * 1000);

    const totalSupply: bigint =
      await testERC1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);
  });

  it("should burn second NFT", async function () {
    this.timeout(60 * 1000);

    // Burn NFT
    await testERC1155EnumerableContract.burnNFT(
      await beneficiary.getAddress(),
      nftTokenId2,
    );
  });

  it("should check NFT balance", async function () {
    this.timeout(60 * 1000);

    const nftBalance: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId2,
    );
    chai.expect(nftBalance).to.equal(0n);
  });

  it("should check total supply with no tokens", async function () {
    this.timeout(60 * 1000);

    const totalSupply: bigint =
      await testERC1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint multiple NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should batch mint two NFTs", async function () {
    this.timeout(60 * 1000);

    // Use tokens with ID 3 and 1 to verify correct sorting later
    const receipt: ContractTransactionReceipt =
      await testERC1155EnumerableContract.batchMintNFT(
        await beneficiary.getAddress(),
        [nftTokenId3, nftTokenId1],
      );
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferBatch");
    chai.expect(log.args[0]).to.equal(await beneficiary.getAddress());
    chai.expect(log.args[1]).to.equal(ZERO_ADDRESS);
    chai.expect(log.args[2]).to.equal(await beneficiary.getAddress());
    chai.expect(log.args[3].length).to.equal(2);
    chai.expect(log.args[3][0]).to.equal(nftTokenId3);
    chai.expect(log.args[3][1]).to.equal(nftTokenId1);
    chai.expect(log.args[4].length).to.equal(2);
    chai.expect(log.args[4][0]).to.equal(1n);
    chai.expect(log.args[4][1]).to.equal(1n);
  });

  it("should check NFT balance", async function () {
    this.timeout(60 * 1000);

    const nftBalance1: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId3,
    );
    chai.expect(nftBalance1).to.equal(1n);

    const nftBalance2: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId1,
    );
    chai.expect(nftBalance2).to.equal(1n);
  });

  it("should check total supply with two tokens", async function () {
    this.timeout(60 * 1000);

    const totalSupply: bigint =
      await testERC1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Burn multiple NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should batch burn two NFTs", async function () {
    this.timeout(60 * 1000);

    // Burn NFTs
    const receipt: ContractTransactionReceipt =
      await testERC1155EnumerableContract.batchBurnNFT(
        await beneficiary.getAddress(),
        [nftTokenId3, nftTokenId1],
      );
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferBatch");
    chai.expect(log.args[0]).to.equal(await beneficiary.getAddress());
    chai.expect(log.args[1]).to.equal(await beneficiary.getAddress());
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

    const nftBalance3: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId3,
    );
    chai.expect(nftBalance3).to.equal(0n);

    const nftBalance1: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId1,
    );
    chai.expect(nftBalance1).to.equal(0n);
  });

  it("should check total supply with no tokens", async function () {
    this.timeout(60 * 1000);

    const totalSupply: bigint =
      await testERC1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Transfer NFTs
  //////////////////////////////////////////////////////////////////////////////

  it("should mint two NFTs", async function () {
    this.timeout(60 * 1000);

    // Mint NFTs
    await testERC1155EnumerableContract.batchMintNFT(
      await beneficiary.getAddress(),
      [nftTokenId3, nftTokenId1],
    );
  });

  it("should transfer both NFTs", async function () {
    this.timeout(60 * 1000);

    // Transfer NFTs
    const receipt: ContractTransactionReceipt =
      await testERC1155EnumerableContract.safeBatchTransferFrom(
        await beneficiary.getAddress(),
        await deployer.getAddress(),
        [nftTokenId3, nftTokenId1],
        [1n, 1n],
        new Uint8Array(),
      );
    chai.expect(receipt).to.not.be.null;

    // Check events
    const logs: (EventLog | Log)[] = receipt!.logs;
    chai.expect(logs.length).to.be.greaterThan(0);

    const log: EventLog = logs[0] as EventLog;
    chai.expect(log.fragment.name).to.equal("TransferBatch");
    chai.expect(log.args[0]).to.equal(await beneficiary.getAddress());
    chai.expect(log.args[1]).to.equal(await beneficiary.getAddress());
    chai.expect(log.args[2]).to.equal(await deployer.getAddress());
    chai.expect(log.args[3].length).to.equal(2);
    chai.expect(log.args[3][0]).to.equal(nftTokenId3);
    chai.expect(log.args[3][1]).to.equal(nftTokenId1);
    chai.expect(log.args[4].length).to.equal(2);
    chai.expect(log.args[4][0]).to.equal(1n);
    chai.expect(log.args[4][1]).to.equal(1n);
  });

  it("should check beneficiary NFT balance", async function () {
    const nftBalance1: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId3,
    );
    chai.expect(nftBalance1).to.equal(0n);

    const nftBalance2: bigint = await testERC1155EnumerableContract.balanceOf(
      await beneficiary.getAddress(),
      nftTokenId1,
    );
    chai.expect(nftBalance2).to.equal(0n);
  });

  it("should check deployer NFT balance", async function () {
    const nftBalance1: bigint = await testERC1155EnumerableContract.balanceOf(
      await deployer.getAddress(),
      nftTokenId3,
    );
    chai.expect(nftBalance1).to.equal(1n);

    const nftBalance2: bigint = await testERC1155EnumerableContract.balanceOf(
      await deployer.getAddress(),
      nftTokenId1,
    );
    chai.expect(nftBalance2).to.equal(1n);
  });

  it("should check total supply after transfer", async function () {
    const totalSupply: bigint =
      await testERC1155EnumerableContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test ownerOf()
  //////////////////////////////////////////////////////////////////////////////

  it("should mint third NFT", async function () {
    this.timeout(60 * 1000);

    // Mint NFT
    await testERC1155EnumerableContract.mintNFT(
      await beneficiary.getAddress(),
      nftTokenId2,
    );
  });

  it("should return the correct owner for an existing NFT", async function () {
    const owner: string =
      await testERC1155EnumerableContract.ownerOf(nftTokenId2);
    chai.expect(owner).to.equal(await beneficiary.getAddress());
  });

  it("should check nonexistent token ID", async function () {
    const owner: string = await testERC1155EnumerableContract.ownerOf(
      nftTokenIdNonexistent,
    );
    chai.expect(owner).to.equal(ZERO_ADDRESS);
  });

  it("should transfer third NFT", async function () {
    this.timeout(60 * 1000);

    // Transfer NFT
    await testERC1155EnumerableContract.safeTransferFrom(
      await beneficiary.getAddress(),
      await deployer.getAddress(),
      nftTokenId2,
      1n,
      new Uint8Array(),
    );
  });

  it("should return the correct owner after transfer", async function () {
    const owner: string =
      await testERC1155EnumerableContract.ownerOf(nftTokenId3);
    chai.expect(owner).to.equal(await deployer.getAddress());
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test getTokenIds()
  //////////////////////////////////////////////////////////////////////////////

  it("should return all token IDs", async function () {
    const beneficiaryTokenIds: bigint[] =
      await testERC1155EnumerableContract.getTokenIds(
        await beneficiary.getAddress(),
      );
    chai.expect(beneficiaryTokenIds.length).to.equal(0);

    const deployerTokenIds: bigint[] =
      await testERC1155EnumerableContract.getTokenIds(
        await deployer.getAddress(),
      );
    chai.expect(deployerTokenIds.length).to.equal(3);
    chai.expect(deployerTokenIds[0]).to.equal(nftTokenId3);
    chai.expect(deployerTokenIds[1]).to.equal(nftTokenId1);
    chai.expect(deployerTokenIds[2]).to.equal(nftTokenId2);
  });
});

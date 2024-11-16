/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { ethers } from "ethers";
import * as hardhat from "hardhat";

import { DutchAuctionManager } from "../../../src/game/admin/dutchAuctionManager";
import { PermissionManager } from "../../../src/game/admin/permissionManager";
import { PoolManager } from "../../../src/game/admin/poolManager";
import { getAddressBook } from "../../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../../src/interfaces/addressBook";
import { WrappedNativeContract } from "../../../src/interfaces/token/erc20/wrappedNativeContract";
import { LPSFTContract } from "../../../src/interfaces/token/erc1155/lpSftContract";
import { ETH_PRICE } from "../../../src/testing/defiMetrics";
import { setupFixture } from "../../../src/testing/setupFixture";
import {
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_POW1_SUPPLY,
} from "../../../src/utils/constants";
import { extractJSONFromURI } from "../../../src/utils/lpNftUtils";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Constants
//

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in WETH

// Token ID of initial minted LP-NFT/L-SFT
const POW1_LPNFT_TOKEN_ID: bigint = 1n;

//
// Test cases
//

describe("DutchAuctionManager", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let beneficiaryAddress: `0x${string}`;
  let addressBook: AddressBook;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use hardhat to get the deployer account
    const signers: SignerWithAddress[] = await hardhat.ethers.getSigners();
    deployer = signers[0];
    beneficiary = signers[1];
    beneficiaryAddress = (await beneficiary.getAddress()) as `0x${string}`;

    // A single fixture is used for the test suite
    await setupTest();

    // Get the network name
    const networkName: string = getNetworkName();

    // Get the address book
    addressBook = await getAddressBook(networkName);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Obtain W-ETH to initialize DutchAuction
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain W-ETH to initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Create contract
    const wrappedNativeContract: WrappedNativeContract =
      new WrappedNativeContract(deployer, addressBook.wrappedNativeToken!);

    // Deposit ETH into W-ETH
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize Dutch Auction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Initialize pools
    const poolManager: PoolManager = new PoolManager(deployer, {
      pow1Token: addressBook.pow1Token!,
      marketToken: addressBook.wrappedNativeToken!,
      pow1MarketPool: addressBook.pow1MarketPool!,
      pow5Token: addressBook.pow5Token!,
      stableToken: addressBook.usdcToken!,
      pow5StablePool: addressBook.pow5StablePool!,
    });
    await poolManager.initializePools();

    // Initialize roles
    const permissionManager: PermissionManager = new PermissionManager(
      deployer,
      {
        pow1Token: addressBook.pow1Token!,
        pow5Token: addressBook.pow5Token!,
        lpPow1Token: addressBook.lpPow1Token!,
        lpPow5Token: addressBook.lpPow5Token!,
        noPow5Token: addressBook.noPow5Token!,
        lpSft: addressBook.lpSft!,
        noLpSft: addressBook.noLpSft!,
        dutchAuction: addressBook.dutchAuction!,
        yieldHarvest: addressBook.yieldHarvest!,
        liquidityForge: addressBook.liquidityForge!,
        reverseRepo: addressBook.reverseRepo!,
        pow1LpNftStakeFarm: addressBook.pow1LpNftStakeFarm!,
        pow5LpNftStakeFarm: addressBook.pow5LpNftStakeFarm!,
        pow1LpSftLendFarm: addressBook.pow1LpSftLendFarm!,
        pow5LpSftLendFarm: addressBook.pow5LpSftLendFarm!,
        defiManager: addressBook.defiManager!,
        pow5InterestFarm: addressBook.pow5InterestFarm!,
      },
    );
    await permissionManager.initializeRoles();

    // Initialize Dutch Auction
    const dutchAuctionManager: DutchAuctionManager = new DutchAuctionManager(
      deployer,
      {
        pow1Token: addressBook.pow1Token!,
        marketToken: addressBook.wrappedNativeToken!,
        dutchAuction: addressBook.dutchAuction!,
      },
    );
    await dutchAuctionManager.initialize(
      INITIAL_POW1_SUPPLY,
      INITIAL_WETH_AMOUNT,
      beneficiaryAddress,
    );

    // Create first LP-NFTs for sale
    await dutchAuctionManager.createInitialAuctions();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT properties
  //////////////////////////////////////////////////////////////////////////////

  it("should verify beneficiary owns first LP-SFT", async function (): Promise<void> {
    // Create contract
    const lpSftContract: LPSFTContract = new LPSFTContract(
      deployer,
      addressBook.lpSft!,
    );

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);

    // Get owner
    const owner: `0x${string}` =
      await lpSftContract.ownerOf(POW1_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(beneficiaryAddress);

    // Get token IDs
    const tokenIds: bigint[] =
      await lpSftContract.getTokenIds(beneficiaryAddress);
    chai.expect(tokenIds.length).to.equal(1);
    chai.expect(tokenIds[0]).to.equal(POW1_LPNFT_TOKEN_ID);
  });

  it("should check POW1 LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    // Create contract
    const lpSftContract: LPSFTContract = new LPSFTContract(
      deployer,
      addressBook.lpSft!,
    );

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
  });
});

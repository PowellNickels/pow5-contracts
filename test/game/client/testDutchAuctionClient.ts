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
import { DutchAuctionClient } from "../../../src/game/client/dutchAuctionClient";
import { getAddressBook } from "../../../src/hardhat/getAddressBook";
import { getNetworkName } from "../../../src/hardhat/hardhatUtils";
import { AddressBook } from "../../../src/interfaces/addressBook";
import { WrappedNativeContract } from "../../../src/interfaces/token/erc20/wrappedNativeContract";
import { ETH_PRICE } from "../../../src/testing/defiMetrics";
import { setupFixture } from "../../../src/testing/setupFixture";
import { TokenTracker } from "../../../src/testing/tokenTracker";
import {
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_POW1_SUPPLY,
  LPPOW1_DECIMALS,
} from "../../../src/utils/constants";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Constants
//

// Initial amount of ETH to start with
const INITIAL_ETH: string = "1"; // 1 ETH

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in WETH

// Token IDs of LP-NFTs for sale
const POW1_LPNFT_FIRST_TOKEN_ID: bigint = 2n;
const POW1_LPNFT_SECOND_TOKEN_ID: bigint = 3n;
const POW1_LPNFT_THIRD_TOKEN_ID: bigint = 4n;

// Amount of WETH to use to purchase first LP-NFT for
const POW1_LPNFT_FIRST_WETH_AMOUNT: bigint =
  ethers.parseEther("10") / BigInt(ETH_PRICE); // $10 in WETH

const LPPOW1_AMOUNT: bigint = 972_835_178_603_057_829n; // About 97e16 LP-POW1

//
// Test cases
//

describe("DutchAuctionClient", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let deployerAddress: `0x${string}`;
  let beneficiary: SignerWithAddress;
  let beneficiaryAddress: `0x${string}`;
  let addressBook: AddressBook;
  let dutchAuctionClient: DutchAuctionClient;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Use hardhat to get the deployer account
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

    // Create the client
    dutchAuctionClient = new DutchAuctionClient(beneficiary, {
      dutchAuction: addressBook.dutchAuction!,
      marketToken: addressBook.wrappedNativeToken!,
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Obtain ETH
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain ETH", async function (): Promise<void> {
    // Convert ETH to hex
    const balanceInWeiHex: string = ethers.toQuantity(
      ethers.parseEther(INITIAL_ETH),
    );

    await hardhat.network.provider.send("hardhat_setBalance", [
      beneficiaryAddress,
      balanceInWeiHex,
    ]);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Obtain W-ETH to initialize DutchAuction
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
  // Test setup: Initialize Dutch Auction
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
  // Spec: Check auction configuration
  //////////////////////////////////////////////////////////////////////////////

  it("should get auction settings", async function (): Promise<void> {
    const auctionSettings: {
      priceDecayRate: bigint;
      mintDustAmount: bigint;
      priceIncrement: bigint;
      initialPriceBips: bigint;
      minPriceBips: bigint;
      maxPriceBips: bigint;
    } = await dutchAuctionClient.getAuctionSettings();

    chai.expect(auctionSettings.priceDecayRate).to.equal(192_540_000_000_000n); // TODO
    chai.expect(auctionSettings.mintDustAmount).to.equal(1000n);
    chai
      .expect(auctionSettings.priceIncrement)
      .to.equal(ethers.parseUnits("1", 18));
    chai
      .expect(auctionSettings.initialPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(auctionSettings.minPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai
      .expect(auctionSettings.maxPriceBips)
      .to.equal(ethers.parseUnits("1", 18));
  });

  it("should get bureau state", async function (): Promise<void> {
    const bureauState: {
      totalAuctions: bigint;
      lastSalePriceBips: bigint;
    } = await dutchAuctionClient.getBureauState();

    chai.expect(bureauState.totalAuctions).to.equal(3n);
    chai.expect(bureauState.lastSalePriceBips).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check current auctions
  //////////////////////////////////////////////////////////////////////////////

  it("should get current auctions", async function (): Promise<void> {
    const currentAuctionCount: bigint =
      await dutchAuctionClient.getCurrentAuctionCount();
    chai.expect(currentAuctionCount).to.equal(3n);

    const currentAuctions: bigint[] =
      await dutchAuctionClient.getCurrentAuctions();
    chai.expect(currentAuctions.length).to.equal(3);
    chai.expect(currentAuctions[0]).to.equal(POW1_LPNFT_FIRST_TOKEN_ID);
    chai.expect(currentAuctions[1]).to.equal(POW1_LPNFT_SECOND_TOKEN_ID);
    chai.expect(currentAuctions[2]).to.equal(POW1_LPNFT_THIRD_TOKEN_ID);

    const currentAuctionStates: {
      lpNftTokenId: bigint;
      startPriceBips: bigint;
      endPriceBips: bigint;
      startTime: bigint;
      salePrice: bigint;
    }[] = await dutchAuctionClient.getCurrentAuctionStates();
    chai.expect(currentAuctionStates.length).to.equal(3);

    chai
      .expect(currentAuctionStates[0].lpNftTokenId)
      .to.equal(POW1_LPNFT_FIRST_TOKEN_ID);
    chai
      .expect(currentAuctionStates[0].startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(currentAuctionStates[0].endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(currentAuctionStates[0].startTime).to.not.equal(0n);
    chai.expect(currentAuctionStates[0].salePrice).to.equal(0n);

    chai
      .expect(currentAuctionStates[1].lpNftTokenId)
      .to.equal(POW1_LPNFT_SECOND_TOKEN_ID);
    chai
      .expect(currentAuctionStates[1].startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(currentAuctionStates[1].endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(currentAuctionStates[1].startTime).to.not.equal(0n);
    chai.expect(currentAuctionStates[1].salePrice).to.equal(0n);

    chai
      .expect(currentAuctionStates[2].lpNftTokenId)
      .to.equal(POW1_LPNFT_THIRD_TOKEN_ID);
    chai
      .expect(currentAuctionStates[2].startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(currentAuctionStates[2].endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(currentAuctionStates[2].startTime).to.not.equal(0n);
    chai.expect(currentAuctionStates[2].salePrice).to.equal(0n);
  });

  it('should get auction state for LP-NFT with token ID "2"', async function (): Promise<void> {
    const auctionState: {
      lpNftTokenId: bigint;
      startPriceBips: bigint;
      endPriceBips: bigint;
      startTime: bigint;
      salePrice: bigint;
    } = await dutchAuctionClient.getAuctionState(POW1_LPNFT_FIRST_TOKEN_ID);

    chai.expect(auctionState.lpNftTokenId).to.equal(POW1_LPNFT_FIRST_TOKEN_ID);
    chai
      .expect(auctionState.startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(auctionState.endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(auctionState.startTime).to.not.equal(0n);
    chai.expect(auctionState.salePrice).to.equal(0n);
  });

  it('should get auction state for LP-NFT with token ID "3"', async function (): Promise<void> {
    const auctionState: {
      lpNftTokenId: bigint;
      startPriceBips: bigint;
      endPriceBips: bigint;
      startTime: bigint;
      salePrice: bigint;
    } = await dutchAuctionClient.getAuctionState(POW1_LPNFT_SECOND_TOKEN_ID);

    chai.expect(auctionState.lpNftTokenId).to.equal(POW1_LPNFT_SECOND_TOKEN_ID);
    chai
      .expect(auctionState.startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(auctionState.endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(auctionState.startTime).to.not.equal(0n);
    chai.expect(auctionState.salePrice).to.equal(0n);
  });

  it('should get auction state for LP-NFT with token ID "4"', async function (): Promise<void> {
    const auctionState: {
      lpNftTokenId: bigint;
      startPriceBips: bigint;
      endPriceBips: bigint;
      startTime: bigint;
      salePrice: bigint;
    } = await dutchAuctionClient.getAuctionState(POW1_LPNFT_THIRD_TOKEN_ID);

    chai.expect(auctionState.lpNftTokenId).to.equal(POW1_LPNFT_THIRD_TOKEN_ID);
    chai
      .expect(auctionState.startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(auctionState.endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(auctionState.startTime).to.not.equal(0n);
    chai.expect(auctionState.salePrice).to.equal(0n);
  });

  it('should get current price for LP-NFT with token ID "2"', async function (): Promise<void> {
    const currentPrice: bigint = await dutchAuctionClient.getCurrentPriceBips(
      POW1_LPNFT_FIRST_TOKEN_ID,
    );

    chai.expect(currentPrice).to.equal(ethers.parseUnits("0.0002", 18));
  });

  it('should get current price for LP-NFT with token ID "3"', async function (): Promise<void> {
    const currentPrice: bigint = await dutchAuctionClient.getCurrentPriceBips(
      POW1_LPNFT_SECOND_TOKEN_ID,
    );

    chai.expect(currentPrice).to.equal(ethers.parseUnits("0.0002", 18));
  });

  it('should get current price for LP-NFT with token ID "4"', async function (): Promise<void> {
    const currentPrice: bigint = await dutchAuctionClient.getCurrentPriceBips(
      POW1_LPNFT_THIRD_TOKEN_ID,
    );

    chai.expect(currentPrice).to.equal(ethers.parseUnits("0.0002", 18));
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Purchase LP-NFT
  //////////////////////////////////////////////////////////////////////////////

  it('should purchase LP-NFT with token ID "2"', async function (): Promise<void> {
    this.timeout(60 * 1000);

    const receipt: ethers.ContractTransactionReceipt =
      await dutchAuctionClient.purchase(
        POW1_LPNFT_FIRST_TOKEN_ID,
        0n,
        POW1_LPNFT_FIRST_WETH_AMOUNT,
        deployerAddress,
        beneficiaryAddress,
      );

    const tokenRoutes: Array<{
      token: `0x${string}`;
      from: `0x${string}`;
      to: `0x${string}`;
      value: bigint;
    }> = TokenTracker.getErc20Routes(receipt.logs);

    let lpPow1Amount: bigint = 0n;

    chai.expect(tokenRoutes.length).to.equal(17);
    for (const tokenRoute of tokenRoutes) {
      if (tokenRoute.token === addressBook.lpPow1Token!) {
        lpPow1Amount = tokenRoute.value;
        break;
      }
    }

    // Calculate DeFi metrics
    console.log(
      `    LP-POW1: ${ethers.formatUnits(lpPow1Amount, LPPOW1_DECIMALS)}`,
    );

    chai.expect(lpPow1Amount).to.equal(LPPOW1_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check auction state after purchase
  //////////////////////////////////////////////////////////////////////////////

  it('should get auction state for LP-NFT with token ID "2" after purchase', async function (): Promise<void> {
    const auctionState: {
      lpNftTokenId: bigint;
      startPriceBips: bigint;
      endPriceBips: bigint;
      startTime: bigint;
      salePrice: bigint;
    } = await dutchAuctionClient.getAuctionState(POW1_LPNFT_FIRST_TOKEN_ID);

    chai.expect(auctionState.lpNftTokenId).to.equal(POW1_LPNFT_FIRST_TOKEN_ID);
    chai
      .expect(auctionState.startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(auctionState.endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(auctionState.startTime).to.not.equal(0n);
    chai
      .expect(auctionState.salePrice)
      .to.equal(ethers.parseUnits("0.0002", 18) - 115_490_641_937n);
  });

  it("should get new prices of LP-NFTs after purchase", async function (): Promise<void> {
    const currentAuctionStates: {
      lpNftTokenId: bigint;
      startPriceBips: bigint;
      endPriceBips: bigint;
      startTime: bigint;
      salePrice: bigint;
    }[] = await dutchAuctionClient.getCurrentAuctionStates();
    chai.expect(currentAuctionStates.length).to.equal(3);

    chai
      .expect(currentAuctionStates[0].lpNftTokenId)
      .to.equal(POW1_LPNFT_THIRD_TOKEN_ID);
    chai
      .expect(currentAuctionStates[0].startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(currentAuctionStates[0].endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(currentAuctionStates[0].startTime).to.not.equal(0n);
    chai.expect(currentAuctionStates[0].salePrice).to.equal(0n);

    chai
      .expect(currentAuctionStates[1].lpNftTokenId)
      .to.equal(POW1_LPNFT_SECOND_TOKEN_ID);
    chai
      .expect(currentAuctionStates[1].startPriceBips)
      .to.equal(ethers.parseUnits("0.0002", 18));
    chai
      .expect(currentAuctionStates[1].endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(currentAuctionStates[1].startTime).to.not.equal(0n);
    chai.expect(currentAuctionStates[1].salePrice).to.equal(0n);

    chai.expect(currentAuctionStates[2].lpNftTokenId).to.equal(5n);
    chai
      .expect(currentAuctionStates[2].startPriceBips)
      .to.equal(ethers.parseUnits("0.0004", 18) - 230_981_283_874n);
    chai
      .expect(currentAuctionStates[2].endPriceBips)
      .to.equal(ethers.parseUnits("0.0001", 18));
    chai.expect(currentAuctionStates[2].startTime).to.not.equal(0n);
    chai.expect(currentAuctionStates[2].salePrice).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Advance time and check price
  //////////////////////////////////////////////////////////////////////////////

  it("should advance time 1 minute", async function () {
    // Duration of time to stake POW5
    const SLEEP_DURATION: number = 60; // 1 minute

    // Increase the time
    await hardhat.network.provider.request({
      method: "evm_increaseTime",
      params: [SLEEP_DURATION],
    });

    // Mine the next block
    await hardhat.network.provider.request({
      method: "evm_mine",
      params: [],
    });
  });

  it("should check price of newest LP-NFT", async function (): Promise<void> {
    const currentPriceBips: bigint =
      await dutchAuctionClient.getCurrentPriceBips(5n);

    chai
      .expect(currentPriceBips)
      .to.equal(ethers.parseUnits("0.0004", 18) - 4_822_699_148_306n);
  });
});

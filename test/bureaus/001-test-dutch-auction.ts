/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import chai from "chai";
import { Contract, ContractTransactionResponse, ethers } from "ethers";
import * as hardhat from "hardhat";

import { AddressBook } from "../../src/interfaces/addressBook";
import { ContractLibrary } from "../../src/interfaces/contractLibrary";
import { ContractLibraryEthers } from "../../src/interfaces/contractLibraryEthers";
import { ETH_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPPOW1_AMOUNT,
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_POW1_PRICE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_PRICE,
  LPPOW1_DECIMALS,
  POW1_DECIMALS,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";
import { getAddressBook } from "../../src/utils/getAddressBook";
import { getContractLibrary } from "../../src/utils/getContractLibrary";
import { extractJSONFromURI } from "../../src/utils/lpNftUtils";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in WETH

// POW1 test reward for LPPOW1 staking incentive
const LPPOW1_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// Remaining dust balances after depositing into LP pool
const LPPOW1_POW1_DUST: bigint = 387n;
const LPPOW1_WETH_DUST: bigint = 0n;

// Token ID of initial minted LP-NFT/L-SFT
const LPPOW1_LPNFT_TOKEN_ID: bigint = 1n;

// Amount of POW1 and WETH dust to give to the Dutch Auction
const POW1_DUST_AMOUNT: bigint = 989_584_199n; // About 1 billionth of a POW1
const WETH_DUST_AMOUNT: bigint =
  ethers.parseEther("0.01") / BigInt(ETH_PRICE) / 1_000_000_000n; // 1 billionth of a cent of WETH

// Maximum amount of loss in the auction due to entering/exiting Uniswap pool
const MAX_LOSS_AMOUNT: bigint = 35n; // 35 units of dust of either token

// Amount of WETH to deposit in the first auction
const AUCTION_WETH_AMOUNT: bigint =
  ethers.parseEther("1000") / BigInt(ETH_PRICE); // $1,000 in ETH

// Amount of LPPOW1 minted in the first auction
const AUCTION_LPPOW1_AMOUNT: bigint = 38_970_275_607_839_876_377n; // 38.970 LPPOW1

// Token ID of the first LP-NFT/LP-SFT sold at auction
const AUCTION_LPNFT_TOKEN_ID: bigint = 2n;

//
// Debug parameters
//

// Debug option to print the LP-NFT's image data URI
const DEBUG_PRINT_LPNFT_IMAGE: boolean = false;

//
// Test cases
//

describe("Bureau 1: Dutch Auction", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture Constants
  //////////////////////////////////////////////////////////////////////////////

  const ERC20_ISSUER_ROLE: string =
    ethers.encodeBytes32String("ERC20_ISSUER_ROLE");
  const LPSFT_ISSUER_ROLE: string =
    ethers.encodeBytes32String("LPSFT_ISSUER_ROLE");
  const LPSFT_OPERATOR_ROLE: string = ethers.encodeBytes32String(
    "LPSFT_OPERATOR_ROLE",
  );

  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let deployer: SignerWithAddress;
  let beneficiary: SignerWithAddress;
  let ethersContracts: ContractLibraryEthers;
  let addressBook: AddressBook;
  let deployerContracts: ContractLibrary;
  let beneficiaryContracts: ContractLibrary;
  let pow1IsToken0: boolean;

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

    // Get the contract library
    deployerContracts = getContractLibrary(deployer, addressBook);
    beneficiaryContracts = getContractLibrary(beneficiary, addressBook);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Obtain W-ETH to initialize DutchAuction
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain W-ETH to initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Deposit ETH into W-ETH
    await wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPPOW1 issuer role to LPSFT
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPPOW1 issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpPow1Contract } = deployerContracts;

    // Grant ERC-20 issuer role to LP-SFT
    await lpPow1Contract.grantRole(ERC20_ISSUER_ROLE, addressBook.lpSft!);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LP-SFT minter role to LPPOW1 stake farm
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LP-SFT minter role to LPPOW1 stake farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract } = deployerContracts;

    // Grant LP-SFT minter role to LPPOW1 stake farm
    await lpSftContract.grantRole(
      LPSFT_ISSUER_ROLE,
      addressBook.pow1LpNftStakeFarm!,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LP-SFT operator role to Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LP-SFT operator role to Dutch Auction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract } = deployerContracts;

    // Grant LP-SFT operator role to Dutch Auction
    await lpSftContract.grantRole(
      LPSFT_OPERATOR_ROLE,
      addressBook.dutchAuction!,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Get pool token order
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPPOW5", async function (): Promise<void> {
    const { pow1PoolerContract } = ethersContracts;

    // Get pool token order
    pow1IsToken0 = await pow1PoolerContract.gameIsToken0();
    chai.expect(pow1IsToken0).to.be.a("boolean");

    console.log(
      `    POW1 is ${pow1IsToken0 ? "token0" : "token1"} ($${INITIAL_POW1_PRICE})`,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPPOW1 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize the LPPOW1 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1PoolContract } = ethersContracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow1IsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_POW1_SUPPLY,
      pow1IsToken0 ? INITIAL_POW1_SUPPLY : INITIAL_WETH_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const tx: ContractTransactionResponse =
      await pow1PoolContract.initialize(INITIAL_PRICE);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the Dutch Auction spending POW1 and WETH
  //////////////////////////////////////////////////////////////////////////////

  it("should approve Dutch Auction to spend POW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Approve Dutch Auction spending POW1 for deployer
    await pow1Contract.approve(addressBook.dutchAuction!, INITIAL_POW1_SUPPLY);
  });

  it("should approve Dutch Auction to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Approve Dutch Auction spending WETH
    await wrappedNativeContract.approve(
      addressBook.dutchAuction!,
      INITIAL_WETH_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = deployerContracts;

    // Calculate DeFi metrics
    const pow1Value: string = ethers.formatUnits(
      INITIAL_POW1_SUPPLY / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );
    const wethValue: string = ethers.formatEther(
      INITIAL_WETH_AMOUNT * BigInt(ETH_PRICE),
    );

    // Log DeFi metrics
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_LPPOW1_AMOUNT,
        LPPOW1_DECIMALS,
      )} POW1 ($${pow1Value})`,
    );
    console.log(
      `    Depositing: ${ethers
        .formatEther(INITIAL_WETH_AMOUNT)
        .toLocaleString()} ETH ($${wethValue})`,
    );

    // Initialize DutchAuction
    await dutchAuctionContract.initialize(
      INITIAL_POW1_SUPPLY, // gameTokenAmount
      INITIAL_WETH_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT POW1 balance", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    // Check LP-SFT POW1 balance
    const pow1Balance: bigint = await defiManagerContract.pow1Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );

    // Calculate DeFi properties
    const pow1Value: string = ethers.formatUnits(
      pow1Balance / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );

    // Log LP-SFT POW1 balance
    console.log(
      `    LP-SFT POW1 dust: ${parseInt(
        pow1Balance.toString(),
      ).toLocaleString()} POW1 wei ($${pow1Value.toLocaleString()})`,
    );

    chai.expect(pow1Balance).to.equal(LPPOW1_POW1_DUST);
  });

  it("should check beneficiary WETH balance", async function (): Promise<void> {
    const { wrappedNativeContract } = beneficiaryContracts;

    // Check WETH balance
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      await beneficiary.getAddress(),
    );

    // Log WETH balance
    if (LPPOW1_WETH_DUST > 0n) {
      console.log(
        `    Beneficiary WETH balance: ${ethers
          .formatEther(wethBalance)
          .toLocaleString()} WETH`,
      );
    }

    chai.expect(wethBalance).to.equal(LPPOW1_WETH_DUST);
  });

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow1Contract, wrappedNativeContract } = deployerContracts;

    // Get Uniswap pool reserves
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      addressBook.pow1Pool!,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      addressBook.pow1Pool!,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW1 reserves: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Pool WETH reserves: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );

    chai.expect(pow1Balance).to.equal(INITIAL_POW1_SUPPLY - LPPOW1_POW1_DUST);
    chai.expect(wethBalance).to.equal(INITIAL_WETH_AMOUNT - LPPOW1_WETH_DUST);
  });

  it("should check initial LP-SFT LPPOW1 balance", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    // Check LP-SFT LPPOW1 balance
    const lpPow1Balance: bigint = await defiManagerContract.lpPow1Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );

    // Calculate DeFi properties
    const lpPow1Price: number = INITIAL_POW5_PRICE;
    const lpPow1Value: string = ethers.formatUnits(
      lpPow1Balance / BigInt(1 / lpPow1Price),
      LPPOW1_DECIMALS,
    );

    // Log LP-SFT LPPOW1 balance
    console.log(
      `    Initial LP-SFT LPPOW1 balance: ${ethers
        .formatUnits(lpPow1Balance, LPPOW1_DECIMALS)
        .toLocaleString()} LPPOW1 ($${lpPow1Value.toLocaleString()})`,
    );

    chai.expect(lpPow1Balance).to.equal(INITIAL_LPPOW1_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LPPOW1 total supply
  //////////////////////////////////////////////////////////////////////////////

  it("should check LPPOW1 total supply", async function (): Promise<void> {
    const { lpPow1Contract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpPow1Contract.totalSupply();
    chai.expect(totalSupply).to.equal(INITIAL_LPPOW1_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT properties
  //////////////////////////////////////////////////////////////////////////////

  it("should verify LP-SFT ownership", async function (): Promise<void> {
    const { lpSftContract } = beneficiaryContracts;

    // Get owner
    const owner: string = await lpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(await beneficiary.getAddress());
  });

  it("should check POW1 LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);

    // Test ownerOf()
    const owner: string = await lpSftContract.ownerOf(LPPOW1_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(await beneficiary.getAddress());

    // Test getTokenIds()
    const beneficiaryTokenIds: bigint[] = await lpSftContract.getTokenIds(
      await beneficiary.getAddress(),
    );
    chai.expect(beneficiaryTokenIds.length).to.equal(1);
    chai.expect(beneficiaryTokenIds[0]).to.equal(LPPOW1_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(LPPOW1_LPNFT_TOKEN_ID);

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

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Obtain WETH dust
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain WETH dust", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Deposit ETH into W-ETH
    await wrappedNativeContract.deposit(WETH_DUST_AMOUNT * 2n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Obtain POW1 dust
  //////////////////////////////////////////////////////////////////////////////

  it("should approve POW1Swapper to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Approve POW1Swapper spending WETH
    await wrappedNativeContract.approve(
      addressBook.pow1Swapper!,
      WETH_DUST_AMOUNT,
    );
  });

  it("should swap WETH dust for POW1 dust", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1SwapperContract } = ethersContracts;

    // Swap WETH for POW1
    const tx: ContractTransactionResponse = await (
      pow1SwapperContract.connect(deployer) as Contract
    ).buyGameToken(WETH_DUST_AMOUNT, await deployer.getAddress());
    await tx.wait();
  });

  it("should check POW1 balance", async function (): Promise<void> {
    const { pow1Contract } = deployerContracts;

    // Check POW1 balance
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      await deployer.getAddress(),
    );

    // Calculate DeFi properties
    const pow1Value: string = ethers.formatUnits(
      pow1Balance / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );

    // Log DeFi properties
    console.log(
      `    Bought ${pow1Balance.toLocaleString()} POW1 ($${pow1Value})`,
    );

    chai.expect(pow1Balance).to.equal(POW1_DUST_AMOUNT);
  });

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow1Contract, wrappedNativeContract } = deployerContracts;

    // Get Uniswap pool reserves
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      addressBook.pow1Pool!,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      addressBook.pow1Pool!,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW1 reserves: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Pool WETH reserves: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );

    chai
      .expect(pow1Balance)
      .to.equal(INITIAL_POW1_SUPPLY - LPPOW1_POW1_DUST - POW1_DUST_AMOUNT);
    chai
      .expect(wethBalance)
      .to.equal(INITIAL_WETH_AMOUNT - LPPOW1_WETH_DUST + WETH_DUST_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Transfer POW1 and W-ETH dust to DutchAuction
  //////////////////////////////////////////////////////////////////////////////

  it("should transfer POW1 dust to DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Transfer POW1 dust to Dutch Auction
    await pow1Contract.transfer(addressBook.dutchAuction!, POW1_DUST_AMOUNT);
  });

  it("should transfer WETH dust to DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = deployerContracts;

    // Transfer WETH to Dutch Auction
    await wrappedNativeContract.transfer(
      addressBook.dutchAuction!,
      WETH_DUST_AMOUNT,
    );
  });

  it("should log DutchAuction balances", async function (): Promise<void> {
    const { pow1Contract, wrappedNativeContract } = deployerContracts;

    // Log Dutch Auction balances
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      addressBook.dutchAuction!,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      addressBook.dutchAuction!,
    );

    console.log(
      `    Auction POW1 balance: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Auction WETH balance: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Set new auction
  //////////////////////////////////////////////////////////////////////////////

  it("should set new auction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = deployerContracts;

    // Set new auction
    await dutchAuctionContract.setAuction(
      0n, // slot
      ethers.parseUnits("1", 18), // targetPrice = 1 bips scaled by 1e18
      ethers.parseUnits("0.5", 18), // priceDecayConstant = 50% scaled by 1e18
      MAX_LOSS_AMOUNT, // maxLossWei
    );
  });

  it("should log DutchAuction balances", async function (): Promise<void> {
    const { pow1Contract, wrappedNativeContract } = deployerContracts;

    // Log Dutch Auction balances
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      addressBook.dutchAuction!,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      addressBook.dutchAuction!,
    );

    console.log(
      `    Auction POW1 balance: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Auction WETH balance: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );
  });

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow1Contract, wrappedNativeContract } = deployerContracts;

    // Get Uniswap pool reserves
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      addressBook.pow1Pool!,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      addressBook.pow1Pool!,
    );

    console.log(
      `    Pool POW1 reserves: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Pool WETH reserves: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );
  });

  it("should check first POW1 LP-SFT price", async function (): Promise<void> {
    const { dutchAuctionContract } = deployerContracts;

    // Get the price of the first LP-SFT
    const price: bigint = await dutchAuctionContract.getPrice(
      0n, // slot
    );
    console.log(
      `    First LP-SFT tip: ${ethers
        .formatUnits(price, 18)
        .toLocaleString()} bips (${ethers
        .formatUnits(price, 20)
        .toLocaleString()}%)`,
    );

    chai.expect(price).to.equal(ethers.parseUnits("1", 18));
  });

  it("should check auction LPPOW1 LP-NFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { uniswapV3NftManagerContract } = ethersContracts;

    // Check total supply
    const totalSupply: bigint = await uniswapV3NftManagerContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);

    // Test ownerOf()
    const owner: string = await uniswapV3NftManagerContract.ownerOf(
      AUCTION_LPNFT_TOKEN_ID,
    );
    chai.expect(owner).to.equal(addressBook.dutchAuction!);

    // Check token URI
    const nftTokenUri: string = await uniswapV3NftManagerContract.tokenURI(
      AUCTION_LPNFT_TOKEN_ID,
    );

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

    if (DEBUG_PRINT_LPNFT_IMAGE) {
      console.log(`    LP-NFT image: ${nftContent.image}`);
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Obtain WETH for first auction
  //////////////////////////////////////////////////////////////////////////////

  it("should obtain WETH to purchase LP-SFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = beneficiaryContracts;

    // Deposit ETH into W-ETH
    await wrappedNativeContract.deposit(AUCTION_WETH_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Purchase LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should approve DutchAuction to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeContract } = beneficiaryContracts;

    // Approve Dutch Auction spending WETH
    await wrappedNativeContract.approve(
      addressBook.dutchAuction!,
      AUCTION_WETH_AMOUNT,
    );
  });

  it("should purchase LP-SFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = beneficiaryContracts;

    console.log(
      `    Purchasing LP-SFT with ${ethers
        .formatEther(AUCTION_WETH_AMOUNT)
        .toLocaleString()} WETH ($${ethers
        .formatEther(AUCTION_WETH_AMOUNT * BigInt(ETH_PRICE))
        .toLocaleString()}`,
    );

    // Purchase LP-SFT
    await dutchAuctionContract.purchase(
      0n, // slot
      0n, // gameTokenAmount
      AUCTION_WETH_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
  });

  it("should check new price of LP-SFT", async function (): Promise<void> {
    const { dutchAuctionContract } = beneficiaryContracts;

    // Get the price of the first LP-SFT
    const price: bigint = await dutchAuctionContract.getPrice(
      0n, // slot
    );
    console.log(
      `    New LP-SFT tip: ${ethers
        .formatUnits(price, 18)
        .toLocaleString()} bips (${ethers
        .formatUnits(price, 20)
        .toLocaleString()}%)`,
    );

    chai.expect(price).to.equal(ethers.parseUnits("1", 18));
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances
  //////////////////////////////////////////////////////////////////////////////

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow1Contract, wrappedNativeContract } = deployerContracts;

    // Get Uniswap pool reserves
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      addressBook.pow1Pool!,
    );
    const wethBalance: bigint = await wrappedNativeContract.balanceOf(
      addressBook.pow1Pool!,
    );

    console.log(
      `    Pool POW1 reserves: ${ethers
        .formatUnits(pow1Balance, POW1_DECIMALS)
        .toLocaleString()} POW1 ($${ethers.formatUnits(
        (BigInt(100 * INITIAL_POW1_PRICE) * pow1Balance) / 100n,
      )})`,
    );
    console.log(
      `    Pool WETH reserves: ${ethers
        .formatEther(wethBalance)
        .toLocaleString()} WETH ($${ethers
        .formatEther(BigInt(ETH_PRICE) * wethBalance)
        .toLocaleString()})`,
    );
  });

  it("should check auction LP-SFT LPPOW1 balance", async function (): Promise<void> {
    const { defiManagerContract } = beneficiaryContracts;

    // Check LP-SFT LPPOW1 balance
    const lpPow1Balance: bigint = await defiManagerContract.lpPow1Balance(
      AUCTION_LPNFT_TOKEN_ID,
    );

    // Calculate DeFi properties
    const lpPow1Price: number = INITIAL_POW5_PRICE;
    const lpPow1Value: string = ethers.formatUnits(
      lpPow1Balance / BigInt(1 / lpPow1Price),
      LPPOW1_DECIMALS,
    );

    // Log LP-SFT LPPOW1 balance
    console.log(
      `    Auction LP-SFT LPPOW1 balance: ${ethers.formatUnits(
        lpPow1Balance,
        LPPOW1_DECIMALS,
      )} LPPOW1 ($${lpPow1Value.toLocaleString()})`,
    );

    chai.expect(lpPow1Balance).to.equal(AUCTION_LPPOW1_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LPPOW1 total supply
  //////////////////////////////////////////////////////////////////////////////

  it("should check LPPOW1 total supply", async function (): Promise<void> {
    const { lpPow1Contract } = beneficiaryContracts;

    // Check total supply
    const totalSupply: bigint = await lpPow1Contract.totalSupply();
    chai
      .expect(totalSupply)
      .to.equal(INITIAL_LPPOW1_AMOUNT + AUCTION_LPPOW1_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint POW1 reward to POW1 LP-NFT stake farm
  //////////////////////////////////////////////////////////////////////////////

  it("should grant deployer ERC20_ISSUER_ROLE for POW1 token", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Grant ERC-20 issuer role to deployer
    await pow1Contract.grantRole(
      ERC20_ISSUER_ROLE,
      await deployer.getAddress(),
    );
  });

  it("should mint POW1 reward to POW1 LP-NFT stake farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1Contract } = deployerContracts;

    // Mint POW1 to the POW1 LP-SFT lend farm
    await pow1Contract.mint(
      addressBook.pow1LpNftStakeFarm!,
      LPPOW1_REWARD_AMOUNT,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Exit POW1 LP-NFT position
  //////////////////////////////////////////////////////////////////////////////

  // TODO: Use AccessControl instead of granting approval here
  it("should approve Dutch Auction to transfer LP-SFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract } = beneficiaryContracts;

    // Approve Dutch Auction to transfer LP-SFT
    await lpSftContract.setApprovalForAll(addressBook.dutchAuction!, true);
  });

  it("should exit LPPOW1 position", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { dutchAuctionContract } = beneficiaryContracts;

    // Exit LPPOW1 position
    await dutchAuctionContract.exit(AUCTION_LPNFT_TOKEN_ID);
  });

  it("should check token balances", async function (): Promise<void> {
    const { pow1Contract } = beneficiaryContracts;

    // Check POW1 balances
    const pow1Balance: bigint = await pow1Contract.balanceOf(
      await beneficiary.getAddress(),
    );

    // Calculate DeFi properties
    const pow1Value: string = ethers.formatUnits(
      pow1Balance / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );

    // Log LP-SFT POW1 balance
    console.log(
      `    Beneficiary POW1 balance: ${parseInt(
        pow1Balance.toString(),
      ).toLocaleString()} POW1 ($${pow1Value.toLocaleString()})`,
    );

    chai.expect(pow1Balance).to.not.equal(0n);
  });
});

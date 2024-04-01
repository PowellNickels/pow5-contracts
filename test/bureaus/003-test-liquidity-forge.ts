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

import { DutchAuctionContract } from "../../src/contracts/bureaus/dutchAuctionContract";
import { LiquidityForgeContract } from "../../src/contracts/bureaus/liquidityForgeContract";
import { YieldHarvestContract } from "../../src/contracts/bureaus/yieldHarvestContract";
import { ContractLibraryEthers } from "../../src/interfaces/contractLibraryEthers";
import { ETH_PRICE } from "../../src/testing/defiMetrics";
import { setupFixture } from "../../src/testing/setupFixture";
import {
  INITIAL_LPPOW1_AMOUNT,
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_AMOUNT,
  INITIAL_POW5_PRICE,
  LPPOW1_DECIMALS,
  POW1_DECIMALS,
  POW5_DECIMALS,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

// POW1 test reward for LPPOW1 staking incentive
const LPPOW1_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// Token IDs of minted LP-NFTs
const LPPOW1_LPNFT_TOKEN_ID: bigint = 1n;

//
// Test cases
//

describe("Bureau 3: Liquidity Forge", () => {
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
  let beneficiary: SignerWithAddress;
  let contracts: ContractLibraryEthers;
  let pow1IsToken0: boolean;

  let dutchAuctionContract: DutchAuctionContract;
  let yieldHarvestContract: YieldHarvestContract;
  let liquidityForgeContract: LiquidityForgeContract;

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
    contracts = await setupTest();

    // Set up DutchAuction for deployer
    dutchAuctionContract = new DutchAuctionContract(deployer, {
      dutchAuction: await contracts.dutchAuctionContract.getAddress(),
    });

    // Set up YieldHarvest for beneficiary
    yieldHarvestContract = new YieldHarvestContract(beneficiary, {
      yieldHarvest: await contracts.yieldHarvestContract.getAddress(),
    });

    // Set up LiquidityForge for beneficiary
    liquidityForgeContract = new LiquidityForgeContract(beneficiary, {
      liquidityForge: await contracts.liquidityForgeContract.getAddress(),
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Mint initial LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPPOW1 issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpPow1TokenContract, lpSftContract } = contracts;

    // Grant ERC-20 issuer role to LP-SFT
    const tx: ContractTransactionResponse = await (
      lpPow1TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await lpSftContract.getAddress());
    await tx.wait();
  });

  it("should grant LP-SFT minter role to LPPOW1 stake farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, pow1LpNftStakeFarmContract } = contracts;

    // Grant LP-SFT minter role to LPPOW1 stake farm
    const tx: ContractTransactionResponse = await (
      lpSftContract.connect(deployer) as Contract
    ).grantRole(
      LPSFT_ISSUER_ROLE,
      await pow1LpNftStakeFarmContract.getAddress(),
    );
    await tx.wait();
  });

  it("should get pool token order for LPPOW1", async function (): Promise<void> {
    const { pow1PoolerContract } = contracts;

    // Get pool token order
    pow1IsToken0 = await pow1PoolerContract.gameIsToken0();
    chai.expect(pow1IsToken0).to.be.a("boolean");
  });

  it("should initialize the LPPOW1 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1PoolContract } = contracts;

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

  it("should obtain WETH to initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeTokenContract } = contracts;

    // Deposit ETH into W-ETH
    const tx: ContractTransactionResponse = await (
      wrappedNativeTokenContract.connect(deployer) as Contract
    ).deposit({
      value: INITIAL_WETH_AMOUNT,
    });
    await tx.wait();
  });

  it("should approve Dutch Auction to spend POW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, dutchAuctionContract } = contracts;

    // Approve Dutch Auction spending POW1 for deployer
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).approve(await dutchAuctionContract.getAddress(), INITIAL_POW1_SUPPLY);
    await tx.wait();
  });

  it("should approve Dutch Auction to spend WETH", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { wrappedNativeTokenContract, dutchAuctionContract } = contracts;

    // Approve Dutch Auction spending WETH
    const tx: ContractTransactionResponse = await (
      wrappedNativeTokenContract.connect(deployer) as Contract
    ).approve(await dutchAuctionContract.getAddress(), INITIAL_WETH_AMOUNT);
    await tx.wait();
  });

  it("should initialize DutchAuction", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Initialize DutchAuction
    dutchAuctionContract.initialize(
      INITIAL_POW1_SUPPLY, // gameTokenAmount
      INITIAL_WETH_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Lend LP-SFT to YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should grant DEFI_OPERATOR_ROLE to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract, yieldHarvestContract } = contracts;

    // Grant DEFI_OPERATOR_ROLE to YieldHarvest
    const tx: ContractTransactionResponse = await (
      defiManagerContract.connect(deployer) as Contract
    ).grantRole(DEFI_OPERATOR_ROLE, await yieldHarvestContract.getAddress());
    await tx.wait();
  });

  it("should grant LPSFT_FARM_OPERATOR_ROLE to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1LpSftLendFarmContract, yieldHarvestContract } = contracts;

    // Grant LPSFT_FARM_OPERATOR_ROLE to YieldHarvest
    const tx: ContractTransactionResponse = await (
      pow1LpSftLendFarmContract.connect(deployer) as Contract
    ).grantRole(
      LPSFT_FARM_OPERATOR_ROLE,
      await yieldHarvestContract.getAddress(),
    );
    await tx.wait();
  });

  it("should mint POW1 reward to the POW1 LP-SFT lend farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1LpSftLendFarmContract, pow1TokenContract } = contracts;

    // Grant issuer role to deployer
    const grantTx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await grantTx.wait();

    // Mint POW1 to the POW1 LP-SFT lend farm
    const mintTx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).mint(await pow1LpSftLendFarmContract.getAddress(), LPPOW1_REWARD_AMOUNT);
    await mintTx.wait();
  });

  it("should lend LP-SFT to YieldHarvest", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Lend LP-SFT to YieldHarvest
    await yieldHarvestContract.lendLpSft(LPPOW1_LPNFT_TOKEN_ID);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant DEFI_OPERATOR_ROLE role to LiquidityForge
  //////////////////////////////////////////////////////////////////////////////

  it("should grant DEFI_OPERATOR_ROLE to LiquidityForge", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract, liquidityForgeContract } = contracts;

    // Grant DEFI_OPERATOR_ROLE to LiquidityForge
    const tx: ContractTransactionResponse = await (
      defiManagerContract.connect(deployer) as Contract
    ).grantRole(DEFI_OPERATOR_ROLE, await liquidityForgeContract.getAddress());
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant ERC20_FARM_OPERATOR_ROLE role to LiquidityForge
  //////////////////////////////////////////////////////////////////////////////

  it("should grant ERC20_FARM_OPERATOR_ROLE to LiquidityForge", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5InterestFarmContract, liquidityForgeContract } = contracts;

    // Grant ERC20_FARM_OPERATOR_ROLE to LiquidityForge
    const tx: ContractTransactionResponse = await (
      pow5InterestFarmContract.connect(deployer) as Contract
    ).grantRole(
      ERC20_FARM_OPERATOR_ROLE,
      await liquidityForgeContract.getAddress(),
    );
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant POW5 issuer role to DefiManager
  //////////////////////////////////////////////////////////////////////////////

  it("should grant POW5 issuer role to DefiManager", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract, pow5TokenContract } = contracts;

    // Grant ERC20_ISSUER_ROLE to DefiManager
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await defiManagerContract.getAddress());
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant NOPOW5 issuer role to DefiManager
  //////////////////////////////////////////////////////////////////////////////

  it("should grant NOPOW5 issuer rol to DefiManager", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract, noPow5TokenContract } = contracts;

    // Grant ERC20_ISSUER_ROLE to DefiManager
    const tx: ContractTransactionResponse = await (
      noPow5TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await defiManagerContract.getAddress());
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Borrow POW5 from LiquidityForge
  //////////////////////////////////////////////////////////////////////////////

  it("should fail to exceed 100x collateralization ratio", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Borrow POW5 from LiquidityForge
    try {
      await liquidityForgeContract.borrowPow5(
        LPPOW1_LPNFT_TOKEN_ID, // tokenId
        INITIAL_POW5_AMOUNT + 1n, // amount
        await beneficiary.getAddress(), // receiver
      );
      chai.assert.fail("Expected an error");
    } catch (error: unknown) {
      chai.expect(error).to.be.an("error");
    }
  });

  it("should check POW1 LP-sFT LPPOW balance", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Calculate DeFi properties
    const lpPow1Value: string = ethers.formatUnits(
      INITIAL_LPPOW1_AMOUNT / BigInt(1 / INITIAL_POW5_PRICE),
      LPPOW1_DECIMALS,
    );

    console.log(
      `    LP-SFT LPPOW1 balance: ${ethers.formatUnits(
        INITIAL_LPPOW1_AMOUNT,
        LPPOW1_DECIMALS,
      )} LPPOW1 ($${lpPow1Value.toLocaleString()})`,
    );
  });

  it("should borrow POW5 from LiquidityForge", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Calculate DeFi properties
    const pow5Value: string = ethers.formatUnits(
      INITIAL_POW5_AMOUNT / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    console.log(
      `    Borrowing POW5: ${ethers.formatUnits(
        INITIAL_POW5_AMOUNT,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value.toLocaleString()})`,
    );

    // Borrow POW5 from LiquidityForge
    await liquidityForgeContract.borrowPow5(
      LPPOW1_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
      await beneficiary.getAddress(), // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after borrowing POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after borrowing POW5", async function (): Promise<void> {
    const { defiManagerContract, pow5TokenContract } = contracts;

    const pow5Amount: bigint = await pow5TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    chai.expect(pow5Amount).to.equal(INITIAL_POW5_AMOUNT);

    const noPow5Amount: bigint = await defiManagerContract.noPow5Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(noPow5Amount).to.equal(INITIAL_POW5_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Test withdrawing LP-SFT before POW5 loan is repaid
  //////////////////////////////////////////////////////////////////////////////

  it("should fail to withdraw LP-SFT before POW5 loan is repaid", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { yieldHarvestContract } = contracts;

    // Attempt to withdraw LP-SFT before POW5 loan is repaid
    try {
      const withdrawTx: ContractTransactionResponse =
        await yieldHarvestContract.withdrawLpSft(LPPOW1_LPNFT_TOKEN_ID);
      await withdrawTx.wait();
      chai.assert.fail("Expected an error");
    } catch (error: unknown) {
      chai.expect(error).to.be.an("error");
    }
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve LiquidityForge to spend POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should approve LiquidityForge to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { liquidityForgeContract, pow5TokenContract } = contracts;

    // Approve LiquidityForge to spend POW5
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(beneficiary) as Contract
    ).approve(await liquidityForgeContract.getAddress(), INITIAL_POW5_AMOUNT);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Repay POW5 loan
  //////////////////////////////////////////////////////////////////////////////

  it("should repay POW5 loan", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Repay POW5 loan
    await liquidityForgeContract.repayPow5(
      LPPOW1_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after repaying POW5
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after repaying POW5", async function (): Promise<void> {
    const { defiManagerContract, pow5TokenContract } = contracts;

    const pow5Amount: bigint = await pow5TokenContract.balanceOf(
      await deployer.getAddress(),
    );
    chai.expect(pow5Amount).to.equal(0n);

    const noPow5Amount: bigint = await defiManagerContract.noPow5Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(noPow5Amount).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT after POW5 loan is repaid
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT after POW5 loan is repaid", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Withdraw LP-SFT after POW5 loan is repaid
    await yieldHarvestContract.withdrawLpSft(LPPOW1_LPNFT_TOKEN_ID);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT balances after withdrawing LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT balances after repaying POW5", async function (): Promise<void> {
    const { defiManagerContract } = contracts;

    const pow1Amount: bigint = await defiManagerContract.pow1Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(pow1Amount).to.not.equal(0n);

    const lpPow1Amount: bigint = await defiManagerContract.lpPow1Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(lpPow1Amount).to.equal(INITIAL_LPPOW1_AMOUNT);

    const noPow5Amount: bigint = await defiManagerContract.noPow5Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );
    chai.expect(noPow5Amount).to.equal(0n);
  });
});

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
import { ReverseRepoContract } from "../../src/contracts/bureaus/reverseRepoContract";
import { YieldHarvestContract } from "../../src/contracts/bureaus/yieldHarvestContract";
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
  INITIAL_POW5_AMOUNT,
  INITIAL_POW5_DEPOSIT,
  INITIAL_POW5_PRICE,
  LPPOW1_DECIMALS,
  LPPOW5_DECIMALS,
  POW1_DECIMALS,
  POW5_DECIMALS,
  USDC_DECIMALS,
  ZERO_ADDRESS,
} from "../../src/utils/constants";
import { encodePriceSqrt } from "../../src/utils/fixedMath";
import { extractJSONFromURI } from "../../src/utils/lpNftUtils";

// Setup Hardhat
const setupTest = hardhat.deployments.createFixture(setupFixture);

//
// Test parameters
//

// Initial amount of WETH to deposit into the Dutch Auction
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

// Initial amount of USDC to deposit into the Reverse Repo
const INITIAL_USDC_AMOUNT: bigint =
  ethers.parseUnits(INITIAL_LPPOW5_USDC_VALUE.toString(), USDC_DECIMALS) /
  BigInt(USDC_PRICE); // 100 USDC ($100)

// POW1 test reward for LPPOW1 staking incentive
const LPPOW1_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// POW1 test reward for LPPOW5 staking incentive
const LPPOW5_REWARD_AMOUNT: bigint = ethers.parseUnits("1000", POW1_DECIMALS); // 1,000 POW1 ($10)

// Remaining dust balances after depositing into LP pool
const LPPOW5_POW5_DUST: bigint = 134_419n;
const LPPOW5_USDC_DUST: bigint = 0n;

// Token IDs of minted LP-NFTs
const LPPOW1_LPNFT_TOKEN_ID: bigint = 1n;
const LPPOW5_LPNFT_TOKEN_ID: bigint = 2n;
const PURCHASED_LPNFT_TOKEN_ID: bigint = 3n;

// Amount of USDC to deposit in the Reverse Repo
const PURCHASE_USDC_AMOUNT: bigint =
  ethers.parseUnits("1000", USDC_DECIMALS) / BigInt(USDC_PRICE); // 1,000 USDC ($1,000)

// Amount of LPPOW5 minted in the first sale
const PURCHASE_LPPOW5_AMOUNT: bigint = 32_597_676_069_972n; // 32 LPPOW5

// Returned USDC after buying
const PURCHASE_POW5_RETURNED: bigint = 9_681_047_111_497_358n; // 9.681 POW5

// USDC lost when a POW5 LP-SFT is purchased and then liquidated
const PURCHASE_USDC_LOST: bigint = 3_536_677n; // 3.536 USDC ($3.54)

//
// Debug parameters
//

// Debug option to print the LP-NFT's image data URI
const DEBUG_PRINT_LPNFT_IMAGE: boolean = false;

//
// Test cases
//

describe("Bureau 4: Reverse Repo", () => {
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
  let pow5IsToken0: boolean;

  let dutchAuctionContract: DutchAuctionContract;
  let liquidityForgeContract: LiquidityForgeContract;
  let yieldHarvestContract: YieldHarvestContract;
  let reverseRepoContract: ReverseRepoContract;

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

    // Set up ReverseRepo for deployer
    reverseRepoContract = new ReverseRepoContract(deployer, {
      reverseRepo: await contracts.reverseRepoContract.getAddress(),
    });
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Dutch Auction
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
  // Test setup: Initialize Yield Harvest
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
  // Test setup: Get pool token order
  //////////////////////////////////////////////////////////////////////////////

  it("should get pool token order for LPPOW5", async function (): Promise<void> {
    const { pow5PoolerContract } = contracts;

    // Get pool token order
    pow5IsToken0 = await pow5PoolerContract.gameIsToken0();
    chai.expect(pow5IsToken0).to.be.a("boolean");

    console.log(
      `    POW5 is ${pow5IsToken0 ? "token0" : "token1"} ($${INITIAL_POW5_PRICE})`,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Test setup: Initialize Liquidity Forge
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

  it("should grant POW5 issuer role to DefiManager", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract, pow5TokenContract } = contracts;

    // Grant ERC20_ISSUER_ROLE to DefiManager
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await defiManagerContract.getAddress());
    await tx.wait();
  });

  it("should grant NOPOW5 issuer role to DefiManager", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { defiManagerContract, noPow5TokenContract } = contracts;

    // Grant ERC20_ISSUER_ROLE to DefiManager
    const tx: ContractTransactionResponse = await (
      noPow5TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await defiManagerContract.getAddress());
    await tx.wait();
  });

  it("should check POW1 LP-sFT LPPOW balance", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Calculate DeFi properties
    const lpPow1Value: string = ethers.formatUnits(
      INITIAL_LPPOW1_AMOUNT / BigInt(1 / INITIAL_POW5_PRICE),
      LPPOW1_DECIMALS,
    );

    console.log(
      `    LPPOW1 balance of POW1 LP-SFT: ${ethers.formatUnits(
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
  // Spec: Send POW5 to deployer
  //////////////////////////////////////////////////////////////////////////////

  it("should send POW5 to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5TokenContract } = contracts;

    // Transfer POW5 to deployer
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(beneficiary) as Contract
    ).transfer(await deployer.getAddress(), INITIAL_POW5_DEPOSIT);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Obtain USDC to initialize ReverseRepo
  //////////////////////////////////////////////////////////////////////////////

  it("should mint USDC to deployer", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { usdcTokenContract } = contracts;

    // Mint USDC to beneficiary
    const tx: ContractTransactionResponse = await usdcTokenContract.mint(
      await deployer.getAddress(),
      INITIAL_USDC_AMOUNT,
    );
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LPPOW5 issuer role to LPSFT
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LPPOW5 issuer role to LPSFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpPow5TokenContract, lpSftContract } = contracts;

    // Grant ERC-20 issuer role to LP-SFT
    const tx: ContractTransactionResponse = await (
      lpPow5TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await lpSftContract.getAddress());
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Grant LP-SFT minter role to LPPOW5 stake farm
  //////////////////////////////////////////////////////////////////////////////

  it("should grant LP-SFT minter role to LPPOW5 stake farm", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, pow5LpNftStakeFarmContract } = contracts;

    // Grant LP-SFT minter role to LPPOW1 stake farm
    const tx: ContractTransactionResponse = await (
      lpSftContract.connect(deployer) as Contract
    ).grantRole(
      LPSFT_ISSUER_ROLE,
      await pow5LpNftStakeFarmContract.getAddress(),
    );
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize the LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize the LPPOW5 pool", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5PoolContract } = contracts;

    // The initial sqrt price [sqrt(amountToken1/amountToken0)] as a Q64.96 value
    const INITIAL_PRICE: bigint = encodePriceSqrt(
      pow5IsToken0 ? INITIAL_USDC_AMOUNT : INITIAL_POW5_DEPOSIT,
      pow5IsToken0 ? INITIAL_POW5_DEPOSIT : INITIAL_USDC_AMOUNT,
    );

    // Initialize the Uniswap V3 pool
    const tx: ContractTransactionResponse =
      await pow5PoolContract.initialize(INITIAL_PRICE);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Create incentive for LPPOW5 pool
  //////////////////////////////////////////////////////////////////////////////

  it("should mint POW1 for LPPOW5 incentive reward", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract } = contracts;

    // Mint POW1 for LPPOW5 incentive reward
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).mint(await deployer.getAddress(), LPPOW5_REWARD_AMOUNT);
    await tx.wait();
  });

  it("should approve POW5LpNftStakeFarm spending POW1", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow1TokenContract, pow5LpNftStakeFarmContract } = contracts;

    // Approve POW5LpNftStakeFarm spending POW1
    const tx: ContractTransactionResponse = await (
      pow1TokenContract.connect(deployer) as Contract
    ).approve(
      await pow5LpNftStakeFarmContract.getAddress(),
      LPPOW5_REWARD_AMOUNT,
    );
    await tx.wait();
  });

  it("should create incentive for LPPOW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5LpNftStakeFarmContract } = contracts;

    // Calculate DeFi properties
    const pow1Value: string = ethers.formatUnits(
      LPPOW5_REWARD_AMOUNT / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );
    console.log(
      `    Creating LPPOW5 incentive with ${ethers.formatUnits(
        LPPOW5_REWARD_AMOUNT,
        POW1_DECIMALS,
      )} POW1 ($${pow1Value})`,
    );

    // Create incentive
    const tx: ContractTransactionResponse = await (
      pow5LpNftStakeFarmContract.connect(deployer) as Contract
    ).createIncentive(LPPOW5_REWARD_AMOUNT);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve the ReverseRepo spending POW5 and USDC
  //////////////////////////////////////////////////////////////////////////////

  it("should approve ReverseRepo to spend POW5", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { pow5TokenContract, reverseRepoContract } = contracts;

    // Approve ReverseRepo spending POW5
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as Contract
    ).approve(await reverseRepoContract.getAddress(), INITIAL_POW5_DEPOSIT);
    await tx.wait();
  });

  it("should approve ReverseRepo to spend USDC", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { usdcTokenContract, reverseRepoContract } = contracts;

    // Approve ReverseRepo spending USDC
    const tx: ContractTransactionResponse = await (
      usdcTokenContract.connect(deployer) as Contract
    ).approve(await reverseRepoContract.getAddress(), INITIAL_USDC_AMOUNT);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Initialize ReverseRepo
  //////////////////////////////////////////////////////////////////////////////

  it("should initialize ReverseRepo", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      INITIAL_POW5_DEPOSIT / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      INITIAL_USDC_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log DeFi metrics
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_POW5_DEPOSIT,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
    console.log(
      `    Depositing: ${ethers.formatUnits(
        INITIAL_USDC_AMOUNT,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    // Initialize ReverseRepo
    reverseRepoContract.initialize(
      INITIAL_POW5_DEPOSIT, // gameTokenAmount
      INITIAL_USDC_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances after initialization
  //////////////////////////////////////////////////////////////////////////////

  it("should check beneficiary POW5 balance after initialization", async function (): Promise<void> {
    const { pow5TokenContract } = contracts;

    // Check beneficiary POW5 balance
    const pow5Balance: bigint = await pow5TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    const pow5Dust: bigint =
      pow5Balance + INITIAL_POW5_DEPOSIT - INITIAL_POW5_AMOUNT;

    // Calculate DeFi properties
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const pow5DustValue: string = ethers.formatUnits(
      pow5Dust / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log LP-SFT POW5 balance
    console.log(
      `    Pool POW5 dust: ${parseInt(
        pow5Dust.toString(),
      ).toLocaleString()} POW5 wei ($${pow5DustValue.toLocaleString()})`,
    );
    console.log(
      `    Beneficiary POW5 balance: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value.toLocaleString()})`,
    );

    chai
      .expect(pow5Balance)
      .to.equal(
        INITIAL_POW5_AMOUNT - INITIAL_POW5_DEPOSIT /*+ LPPOW5_POW5_DUST*/,
      );
    chai.expect(pow5Dust).to.equal(0n /*LPPOW5_POW5_DUST*/);
  });

  it("should check beneficiary USDC balance after initialization", async function (): Promise<void> {
    const { usdcTokenContract } = contracts;

    // Check USDC balance
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      await beneficiary.getAddress(),
    );

    // Calculate USDC value
    const usdcValue: string = ethers.formatUnits(
      INITIAL_USDC_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log USDC balance
    if (LPPOW5_USDC_DUST > 0n) {
      console.log(
        `    Beneficiary USDC balance: ${ethers.formatUnits(
          usdcBalance,
          USDC_DECIMALS,
        )} USDC ($${usdcValue})`,
      );
    }

    chai.expect(usdcBalance).to.equal(LPPOW5_USDC_DUST);
  });

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow5PoolContract, pow5TokenContract, usdcTokenContract } =
      contracts;

    // Get Uniswap pool reserves
    const pow5Balance: bigint = await pow5TokenContract.balanceOf(
      await pow5PoolContract.getAddress(),
    );
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      await pow5PoolContract.getAddress(),
    );

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      usdcBalance * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW5 reserves: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
    console.log(
      `    Pool USDC reserves: ${ethers.formatUnits(
        usdcBalance,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    chai.expect(pow5Balance).to.equal(INITIAL_POW5_DEPOSIT - LPPOW5_POW5_DUST);
    //chai.expect(usdcBalance).to.equal(INITIAL_USDC_AMOUNT - LPPOW5_USDC_DUST);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LPPOW5 total supply
  //////////////////////////////////////////////////////////////////////////////

  it("should check LPPOW5 total supply", async function (): Promise<void> {
    const { lpPow5TokenContract } = contracts;

    // Check total supply
    const totalSupply: bigint = await lpPow5TokenContract.totalSupply();
    chai.expect(totalSupply).to.equal(INITIAL_LPPOW5_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT properties
  //////////////////////////////////////////////////////////////////////////////

  it("should verify LP-SFT ownership", async function (): Promise<void> {
    const { lpSftContract } = contracts;

    // Get owner
    const owner: string = await lpSftContract.ownerOf(LPPOW5_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(await beneficiary.getAddress());
  });

  it("should check POW5 LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    const { lpSftContract } = contracts;

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(2n);

    // Test ownerOf()
    const owner: string = await lpSftContract.ownerOf(LPPOW5_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(await beneficiary.getAddress());

    // Test getTokenIds()
    const beneficiaryTokenIds: bigint[] = await lpSftContract.getTokenIds(
      await beneficiary.getAddress(),
    );
    chai.expect(beneficiaryTokenIds.length).to.equal(2);
    chai.expect(beneficiaryTokenIds[0]).to.equal(LPPOW1_LPNFT_TOKEN_ID);
    chai.expect(beneficiaryTokenIds[1]).to.equal(LPPOW5_LPNFT_TOKEN_ID);

    // Check token URI
    const nftTokenUri: string = await lpSftContract.uri(LPPOW5_LPNFT_TOKEN_ID);

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
  // Spec: Mint USDC to beneficiary for second POW5 LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should mint USDC to beneficiary", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { usdcTokenContract } = contracts;

    // Mint USDC to beneficiary
    const tx: ContractTransactionResponse = await usdcTokenContract.mint(
      await beneficiary.getAddress(),
      PURCHASE_USDC_AMOUNT,
    );
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Approve Reverse Repo spending USDC
  //////////////////////////////////////////////////////////////////////////////

  it("should approve ReverseRepo to spend USDC", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { usdcTokenContract, reverseRepoContract } = contracts;

    // Approve ReverseRepo spending USDC
    const tx: ContractTransactionResponse = await (
      usdcTokenContract.connect(beneficiary) as Contract
    ).approve(await reverseRepoContract.getAddress(), PURCHASE_USDC_AMOUNT);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Buy an POW5 LP-SFT from ReverseRepo
  //////////////////////////////////////////////////////////////////////////////

  it("should buy POW5 LP-SFT from ReverseRepo", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = contracts;

    // Calculate DeFi metrics
    const usdcValue: string = ethers.formatUnits(
      PURCHASE_USDC_AMOUNT * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log DeFi metrics
    console.log(
      `    Spending: ${ethers.formatUnits(
        PURCHASE_USDC_AMOUNT,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    // Buy POW5 LP-SFT from ReverseRepo
    const tx = await (
      reverseRepoContract.connect(beneficiary) as Contract
    ).purchase(
      0n, // gameTokenAmount
      PURCHASE_USDC_AMOUNT, // assetTokenAmount
      await beneficiary.getAddress(), // receiver
    );
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances after purchase
  //////////////////////////////////////////////////////////////////////////////

  it("should check POW5 balance after purchase", async function (): Promise<void> {
    const { pow5TokenContract } = contracts;

    // Check POW5 balance
    const pow5Balance: bigint = await pow5TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log POW5 balance
    console.log(
      `    Leftover POW5 balance: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );

    chai.expect(pow5Balance).to.equal(
      INITIAL_POW5_AMOUNT -
        INITIAL_POW5_DEPOSIT +
        LPPOW5_POW5_DUST +
        9_681_047_111_497_358n, // TODO: Magic constant (9.681 POW5)
    );
  });

  it("should check USDC balance after purchase", async function (): Promise<void> {
    const { usdcTokenContract } = contracts;

    // Check USDC balance
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    chai.expect(usdcBalance).to.equal(0n);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token balances
  //////////////////////////////////////////////////////////////////////////////

  it("should log Uniswap pool reserves", async function (): Promise<void> {
    const { pow5PoolContract, pow5TokenContract, usdcTokenContract } =
      contracts;

    // Get Uniswap pool reserves
    const pow5Balance: bigint = await pow5TokenContract.balanceOf(
      await pow5PoolContract.getAddress(),
    );
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      await pow5PoolContract.getAddress(),
    );

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      usdcBalance * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log Uniswap pool reserves
    console.log(
      `    Pool POW5 reserves: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
    console.log(
      `    Pool USDC reserves: ${ethers.formatUnits(
        usdcBalance,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );
  });

  it("should check purchase LP-SFT LPPOW5 balance", async function (): Promise<void> {
    const { defiManagerContract } = contracts;

    // Check LP-SFT LPPOW5 balance
    const lpPow5Balance: bigint = await defiManagerContract.lpPow5Balance(
      PURCHASED_LPNFT_TOKEN_ID,
    );

    // Log LP-SFT LPPOW5 balance
    console.log(
      `    Purchased LPPOW5: ${ethers.formatUnits(
        lpPow5Balance,
        LPPOW5_DECIMALS,
      )} LPPOW5`,
    );

    chai.expect(lpPow5Balance).to.equal(PURCHASE_LPPOW5_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LPPOW5 total supply
  //////////////////////////////////////////////////////////////////////////////

  it("should check LPPOW5 total supply", async function (): Promise<void> {
    const { lpPow5TokenContract } = contracts;

    // Check total supply
    const totalSupply: bigint = await lpPow5TokenContract.totalSupply();
    chai
      .expect(totalSupply)
      .to.equal(INITIAL_LPPOW5_AMOUNT + PURCHASE_LPPOW5_AMOUNT);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Liquidate the purchased POW5 LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  it("should check POW1 balance before liquidation to calculate earnings", async function (): Promise<void> {
    const { pow1TokenContract } = contracts;

    // Check POW1 balance
    const pow1Balance: bigint = await pow1TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    chai.expect(pow1Balance).to.equal(0n);
  });

  it("should approve ReverseRepo to manager POW5 LP-SFTs", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { lpSftContract, reverseRepoContract } = contracts;

    // Approve ReverseRepo to manage POW5 LP-SFT
    const tx: ContractTransactionResponse = await (
      lpSftContract.connect(beneficiary) as Contract
    ).setApprovalForAll(await reverseRepoContract.getAddress(), true);
    await tx.wait();
  });

  it("should liquidate purchased POW5 LP-SFT", async function (): Promise<void> {
    this.timeout(60 * 1000);

    const { reverseRepoContract } = contracts;

    // Liquidate POW5 LP-SFT
    const tx: ContractTransactionResponse = await (
      reverseRepoContract.connect(beneficiary) as Contract
    ).exit(PURCHASED_LPNFT_TOKEN_ID);
    await tx.wait();
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check token amounts after liquidation
  //////////////////////////////////////////////////////////////////////////////

  it("should check earnings and losses after liquidation", async function (): Promise<void> {
    const { pow1TokenContract, pow5TokenContract, usdcTokenContract } =
      contracts;

    // Check balances
    const pow1Balance: bigint = await pow1TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    const pow5Balance: bigint = await pow5TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      await beneficiary.getAddress(),
    );

    // Calculate token metrics
    const pow1Returned: bigint = pow1Balance;
    const pow5Returned: bigint =
      pow5Balance -
      INITIAL_POW5_AMOUNT +
      INITIAL_POW5_DEPOSIT -
      LPPOW5_POW5_DUST;
    const usdcLost: bigint = -(usdcBalance - PURCHASE_USDC_AMOUNT);

    // Calculate DeFi metrics
    const pow1ReturnedValue: string = ethers.formatUnits(
      pow1Returned / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );
    const pow5ReturnedValue: string = ethers.formatUnits(
      pow5Returned / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcLostValue: string = ethers.formatUnits(
      usdcLost * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );
    const totalLost: number =
      parseFloat(usdcLostValue) -
      parseFloat(pow1ReturnedValue) -
      parseFloat(pow5ReturnedValue);
    const totalLostValue: string = totalLost.toLocaleString();
    const totalLostPercent: string = (
      (100 * totalLost) /
      parseFloat(ethers.formatUnits(PURCHASE_USDC_AMOUNT, USDC_DECIMALS))
    ).toLocaleString();

    // Log amounts
    console.log(
      `    Earned POW1: ${ethers.formatUnits(
        pow1Returned,
        POW1_DECIMALS,
      )} POW1 ($${pow1ReturnedValue})`,
    );
    console.log(
      `    Earned POW5: ${ethers.formatUnits(
        pow5Returned,
        POW5_DECIMALS,
      )} POW5 ($${pow5ReturnedValue})`,
    );
    console.log(
      `    Lost USDC: ${ethers.formatUnits(
        usdcLost,
        USDC_DECIMALS,
      )} USDC ($${usdcLostValue})`,
    );
    console.log(`    Total loss: ${totalLostPercent}% ($${totalLostValue})`);

    chai.expect(pow1Returned).to.equal(0n); // This will change after adding rewards
    chai.expect(pow5Returned).to.equal(PURCHASE_POW5_RETURNED);
    chai.expect(usdcLost).to.equal(PURCHASE_USDC_LOST);
  });

  it("should check balances after liquidation", async function (): Promise<void> {
    const { pow1TokenContract, pow5TokenContract, usdcTokenContract } =
      contracts;

    // Check balances
    const pow1Balance: bigint = await pow1TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    const pow5Balance: bigint = await pow5TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    const usdcBalance: bigint = await usdcTokenContract.balanceOf(
      await beneficiary.getAddress(),
    );

    // Calculate DeFi metrics
    const pow1Value: string = ethers.formatUnits(
      pow1Balance / BigInt(1 / INITIAL_POW1_PRICE),
      POW1_DECIMALS,
    );
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );
    const usdcValue: string = ethers.formatUnits(
      usdcBalance * BigInt(USDC_PRICE),
      USDC_DECIMALS,
    );

    // Log balances
    console.log(
      `    Beneficiary POW1 balance: ${ethers.formatUnits(
        pow1Balance,
        POW1_DECIMALS,
      )} POW1 ($${pow1Value})`,
    );
    console.log(
      `    Beneficiary POW5 balance: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
    console.log(
      `    Beneficiary USDC balance: ${ethers.formatUnits(
        usdcBalance,
        USDC_DECIMALS,
      )} USDC ($${usdcValue})`,
    );

    chai.expect(pow1Balance).to.equal(0n); // TODO: Simulate rewards
    chai
      .expect(pow5Balance)
      .to.equal(
        INITIAL_POW5_AMOUNT -
          INITIAL_POW5_DEPOSIT +
          LPPOW5_POW5_DUST +
          PURCHASE_POW5_RETURNED,
      );
    chai.expect(parseInt(usdcBalance.toString())).to.be.greaterThan(0);
    chai
      .expect(parseInt(usdcBalance.toString()))
      .to.be.lessThan(parseInt(PURCHASE_USDC_AMOUNT.toString()));
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check POW5 LP-NFT and LP-SFT owners after liquidation
  //////////////////////////////////////////////////////////////////////////////

  it("should check POW5 LP-NFT owner after liquidation", async function (): Promise<void> {
    const { uniswapV3NftManagerContract } = contracts;

    // Check LP-NFT owner
    const owner: string = await uniswapV3NftManagerContract.ownerOf(
      PURCHASED_LPNFT_TOKEN_ID,
    );
    chai.expect(owner).to.equal(await beneficiary.getAddress());
  });

  it("should check POW5 LP-SFT owner after liquidation", async function (): Promise<void> {
    const { lpSftContract } = contracts;

    // Check LP-SFT owner
    const owner: string = await lpSftContract.ownerOf(PURCHASED_LPNFT_TOKEN_ID);
    chai.expect(owner).to.equal(ZERO_ADDRESS);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Mint POW5 to repay loan
  //////////////////////////////////////////////////////////////////////////////

  it("should check NOPOW5 balance of POW1 LP-SFT", async function (): Promise<void> {
    const { defiManagerContract } = contracts;

    // Check NOPOW5 balance
    const noPow5Balance: bigint = await defiManagerContract.noPow5Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );

    // Calculate DeFi metrics
    const noPow5Value: string = ethers.formatUnits(
      noPow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log NOPOW5 balance
    console.log(
      `    NOPOW5 balance of POW1 LP-SFT: ${ethers.formatUnits(
        noPow5Balance,
        POW5_DECIMALS,
      )} NOPOW5 ($${noPow5Value})`,
    );
  });

  it("should check POW5 deficit", async function (): Promise<void> {
    const { defiManagerContract, pow5TokenContract } = contracts;

    // Check POW5 and NOPOW5 balances
    const pow5Balance: bigint = await pow5TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    const noPow5Balance: bigint = await defiManagerContract.noPow5Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );

    // Calculate deficit
    const deficit: bigint = noPow5Balance - pow5Balance;

    // Calculate DeFi metrics
    const deficitValue: string = ethers.formatUnits(
      deficit / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log amounts
    console.log(
      `    Deficit: ${ethers.formatUnits(
        deficit,
        POW5_DECIMALS,
      )} POW5 ($${deficitValue})`,
    );
  });

  it("should grant POW5 issuer role to deployer", async function (): Promise<void> {
    const { pow5TokenContract } = contracts;

    // Grant ERC20_ISSUER_ROLE to deployer
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as Contract
    ).grantRole(ERC20_ISSUER_ROLE, await deployer.getAddress());
    await tx.wait();
  });

  it("should mint missing POW5 deficit", async function (): Promise<void> {
    const { defiManagerContract, pow5TokenContract } = contracts;

    // Check POW5 and NOPOW5 balances
    const pow5Balance: bigint = await pow5TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );
    const noPow5Balance: bigint = await defiManagerContract.noPow5Balance(
      LPPOW1_LPNFT_TOKEN_ID,
    );

    // Calculate deficit
    const deficit: bigint = noPow5Balance - pow5Balance;

    // Mint missing POW5 deficit
    const tx: ContractTransactionResponse = await (
      pow5TokenContract.connect(deployer) as Contract
    ).mint(await beneficiary.getAddress(), deficit);
    await tx.wait();
  });

  it("should log new POW5 balance after minting POW5", async function (): Promise<void> {
    const { pow5TokenContract } = contracts;

    // Check POW5 balance
    const pow5Balance: bigint = await pow5TokenContract.balanceOf(
      await beneficiary.getAddress(),
    );

    // Calculate DeFi metrics
    const pow5Value: string = ethers.formatUnits(
      pow5Balance / BigInt(1 / INITIAL_POW5_PRICE),
      POW5_DECIMALS,
    );

    // Log POW5 balance
    console.log(
      `    Beneficiary POW5 balance: ${ethers.formatUnits(
        pow5Balance,
        POW5_DECIMALS,
      )} POW5 ($${pow5Value})`,
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Repay POW5 loan to LiquidityForge
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

  it("should repay POW5 loan", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Repay POW5 loan
    liquidityForgeContract.repayPow5(
      LPPOW1_LPNFT_TOKEN_ID, // tokenId
      INITIAL_POW5_AMOUNT, // amount
    );
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Withdraw LP-SFT from YieldHarvest
  //////////////////////////////////////////////////////////////////////////////

  it("should withdraw LP-SFT after POW5 loan is repaid", async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Withdraw LP-SFT after POW5 loan is repaid
    yieldHarvestContract.withdrawLpSft(LPPOW1_LPNFT_TOKEN_ID);
  });
});

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { DutchAuctionContract } from "../../interfaces/bureaucracy/dutchAuction/dutchAuctionContract";
import { WrappedNativeContract } from "../../interfaces/token/erc20/wrappedNativeContract";
import { ERC20Contract } from "../../interfaces/zeppelin/token/erc20/erc20Contract";

//////////////////////////////////////////////////////////////////////////////
// Constants
//////////////////////////////////////////////////////////////////////////////

// Initial number of LP-NFTs to mint for auction
const INITIAL_AUCTION_COUNT: number = 3;

// Amount of WETH dust to use for auction creation
const INITIAL_WETH_DUST: bigint = 1_000n; // 1,000 wei

//////////////////////////////////////////////////////////////////////////////
// Types
//////////////////////////////////////////////////////////////////////////////

// Required addresses
type Addresses = {
  dutchAuction: `0x${string}`;
  marketToken: `0x${string}`;
  pow1Token: `0x${string}`;
};

//////////////////////////////////////////////////////////////////////////////
// Permission Manager
//////////////////////////////////////////////////////////////////////////////

/**
 * @description Manages the Dutch Auction
 */
class DutchAuctionManager {
  private admin: ethers.Signer;
  private addresses: Addresses;
  private dutchAuctionContract: DutchAuctionContract;
  private marketTokenContract: WrappedNativeContract;
  private pow1Contract: ERC20Contract;

  constructor(admin: ethers.Signer, addresses: Addresses) {
    this.admin = admin;
    this.addresses = addresses;
    this.dutchAuctionContract = new DutchAuctionContract(
      this.admin,
      this.addresses.dutchAuction,
    );
    this.marketTokenContract = new WrappedNativeContract(
      this.admin,
      this.addresses.marketToken,
    );
    this.pow1Contract = new ERC20Contract(this.admin, this.addresses.pow1Token);
  }

  /**
   * @description Initializes the Dutch Auction
   *
   * Returns approval promises and a lambda to execute spending transactions
   * after approvals.
   *
   * @param poolSetup - Promise for pool setup transactions
   * @param roleSetup - Promise for role setup transactions
   * @param initialPow1 - The amount of POW1 tokens to spend
   * @param initialMarketToken - The amount of the market token to spend
   * @param lpSftReceiver - The address that receives the first LP-SFT
   *
   * @returns {Promise<ethers.ContractTransactionReceipt>} A promise that
   * resolves to the transaction receipt
   */
  async initialize(
    poolSetup: Promise<Array<ethers.ContractTransactionReceipt>>,
    roleSetup: Promise<Array<ethers.ContractTransactionReceipt>>,
    initialPow1: bigint,
    initialMarketToken: bigint,
    lpSftReceiver: `0x${string}`,
  ): Promise<ethers.ContractTransactionReceipt> {
    const approvalPromises: Array<Promise<ethers.ContractTransactionReceipt>> =
      [];

    // Approve Dutch Auction spending POW1, if needed
    const pow1Allowance: bigint = await this.pow1Contract.allowance(
      (await this.admin.getAddress()) as `0x${string}`,
      this.dutchAuctionContract.address,
    );
    if (pow1Allowance < initialPow1) {
      approvalPromises.push(
        this.pow1Contract.approve(
          this.addresses.dutchAuction,
          initialPow1 - pow1Allowance,
        ),
      );
    }

    // Deposit WETH if needed
    const wethBalance: bigint = await this.marketTokenContract.balanceOf(
      (await this.admin.getAddress()) as `0x${string}`,
    );
    if (wethBalance < initialMarketToken) {
      approvalPromises.push(
        this.marketTokenContract.deposit(initialMarketToken - wethBalance),
      );
    }

    // Approve Dutch Auction spending market token, if needed
    const marketTokenAllowance: bigint =
      await this.marketTokenContract.allowance(
        (await this.admin.getAddress()) as `0x${string}`,
        this.dutchAuctionContract.address,
      );
    if (marketTokenAllowance < initialMarketToken) {
      approvalPromises.push(
        this.marketTokenContract.approve(
          this.addresses.dutchAuction,
          initialMarketToken - marketTokenAllowance,
        ),
      );
    }

    // Wait for all setup transactions to complete
    await Promise.all([poolSetup, roleSetup, Promise.all(approvalPromises)]);

    return this.dutchAuctionContract.initialize(
      initialPow1,
      initialMarketToken,
      lpSftReceiver,
    );
  }

  async isInitialized(): Promise<boolean> {
    return this.dutchAuctionContract.isInitialized();
  }

  async createInitialAuctions(
    initializeTx: Promise<ethers.ContractTransactionReceipt> | null,
  ): Promise<ethers.ContractTransactionReceipt> {
    // Wait for initial tokens to be spent
    if (initializeTx) {
      await initializeTx;
    }

    const pendingTransactions: Array<
      Promise<ethers.ContractTransactionReceipt>
    > = [];

    // Get dust for LP-NFT creation, if needed
    const marketTokenBalance = await this.marketTokenContract.balanceOf(
      (await this.admin.getAddress()) as `0x${string}`,
    );
    if (marketTokenBalance < INITIAL_WETH_DUST) {
      pendingTransactions.push(
        this.marketTokenContract.deposit(
          INITIAL_WETH_DUST - marketTokenBalance,
        ),
      );
    }

    // Approve spending dust for LP-NFT creation, if needed
    const marketTokenAllowance = await this.marketTokenContract.allowance(
      (await this.admin.getAddress()) as `0x${string}`,
      this.addresses.dutchAuction,
    );
    if (marketTokenAllowance < INITIAL_WETH_DUST) {
      pendingTransactions.push(
        this.marketTokenContract.approve(
          this.addresses.dutchAuction,
          INITIAL_WETH_DUST - marketTokenAllowance,
        ),
      );
    }

    // Wait for all pending transactions to complete
    await Promise.all(pendingTransactions);

    // Set auction count
    return this.dutchAuctionContract.setAuctionCount(
      INITIAL_AUCTION_COUNT,
      INITIAL_WETH_DUST,
    );
  }

  async getCurrentAuctionCount(): Promise<number> {
    return this.dutchAuctionContract.getAuctionCount();
  }
}

export { DutchAuctionManager };

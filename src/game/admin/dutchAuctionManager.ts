/*
 * Copyright (C) 2024 Powell
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { DutchAuctionContract } from "../../interfaces/bureaucracy/dutchAuction/dutchAuctionContract";
import { ERC20Contract } from "../../interfaces/zeppelin/token/erc20/erc20Contract";

//////////////////////////////////////////////////////////////////////////////
// Types
//////////////////////////////////////////////////////////////////////////////

// Required addresses
type Addresses = {
  pow1Token: `0x${string}`;
  marketToken: `0x${string}`;
  dutchAuction: `0x${string}`;
};

//////////////////////////////////////////////////////////////////////////////
// Permission Manager
//////////////////////////////////////////////////////////////////////////////

/**
 * @description Manages the role assignments
 */
class DutchAuctionManager {
  private admin: ethers.Signer;
  private addresses: Addresses;

  constructor(admin: ethers.Signer, addresses: Addresses) {
    this.admin = admin;
    this.addresses = addresses;
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

    // Create contracts
    const pow1Contract: ERC20Contract = new ERC20Contract(
      this.admin,
      this.addresses.pow1Token,
    );
    const marketTokenContract: ERC20Contract = new ERC20Contract(
      this.admin,
      this.addresses.marketToken,
    );
    const dutchAuctionContract: DutchAuctionContract = new DutchAuctionContract(
      this.admin,
      this.addresses.dutchAuction,
    );

    // Approve Dutch Auction spending POW1, if needed
    const pow1Allowance: bigint = await pow1Contract.allowance(
      (await this.admin.getAddress()) as `0x${string}`,
      dutchAuctionContract.address,
    );
    if (pow1Allowance < initialPow1) {
      approvalPromises.push(
        pow1Contract.approve(
          this.addresses.dutchAuction,
          initialPow1 - pow1Allowance,
        ),
      );
    }

    // Approve Dutch Auction spending market token, if needed
    const marketTokenAllowance: bigint = await marketTokenContract.allowance(
      (await this.admin.getAddress()) as `0x${string}`,
      dutchAuctionContract.address,
    );
    if (marketTokenAllowance < initialMarketToken) {
      approvalPromises.push(
        marketTokenContract.approve(
          this.addresses.dutchAuction,
          initialMarketToken - marketTokenAllowance,
        ),
      );
    }

    // Wait for all setup transactions to complete
    await Promise.all([poolSetup, roleSetup, Promise.all(approvalPromises)]);

    return dutchAuctionContract.initialize(
      initialPow1,
      initialMarketToken,
      lpSftReceiver,
    );
  }
}

export { DutchAuctionManager };

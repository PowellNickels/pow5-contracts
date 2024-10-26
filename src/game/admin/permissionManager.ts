/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { DeFiManagerContract } from "../../interfaces/defi/defiManagerContract";
import { POW1LpSftLendFarmContract } from "../../interfaces/defi/pow1LpSftLendFarmContract";
import { POW5InterestFarmContract } from "../../interfaces/defi/pow5InterestFarmContract";
import { POW5LpSftLendFarmContract } from "../../interfaces/defi/pow5LpSftLendFarmContract";
import { LPPOW1Contract } from "../../interfaces/token/erc20/lpPow1Contract";
import { LPPOW5Contract } from "../../interfaces/token/erc20/lpPow5Contract";
import { NOPOW5Contract } from "../../interfaces/token/erc20/noPow5Contract";
import { POW5Contract } from "../../interfaces/token/erc20/pow5Contract";
import { LPSFTContract } from "../../interfaces/token/erc1155/lpSftContract";
import { NOLPSFTContract } from "../../interfaces/token/erc1155/noLpSftContract";
import { AccessControlContract } from "../../interfaces/zeppelin/access/accessControlContract";

//////////////////////////////////////////////////////////////////////////////
// Constants
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
// Types
//////////////////////////////////////////////////////////////////////////////

// Required addresses
type Addresses = {
  pow1Token: `0x${string}`;
  pow5Token: `0x${string}`;
  lpPow1Token: `0x${string}`;
  lpPow5Token: `0x${string}`;
  noPow5Token: `0x${string}`;
  lpSft: `0x${string}`;
  noLpSft: `0x${string}`;
  dutchAuction: `0x${string}`;
  yieldHarvest: `0x${string}`;
  liquidityForge: `0x${string}`;
  reverseRepo: `0x${string}`;
  pow1LpNftStakeFarm: `0x${string}`;
  pow5LpNftStakeFarm: `0x${string}`;
  pow1LpSftLendFarm: `0x${string}`;
  pow5LpSftLendFarm: `0x${string}`;
  defiManager: `0x${string}`;
  pow5InterestFarm: `0x${string}`;
};

interface RoleAssignment {
  role: string;
  contract: AccessControlContract;
}

type RoleGroup = Record<`0x${string}`, Array<RoleAssignment>>;

//////////////////////////////////////////////////////////////////////////////
// Permission Manager
//////////////////////////////////////////////////////////////////////////////

/**
 * @description Manages the role assignments
 */
class PermissionManager {
  private admin: ethers.Signer;
  private addresses: Addresses;

  constructor(admin: ethers.Signer, addresses: Addresses) {
    this.admin = admin;
    this.addresses = addresses;
  }

  /**
   * @description Initializes all roles
   *
   * @returns {Promise<Array<ethers.ContractTransactionReceipt>>} A promise that
   * resolves to an array of transaction receipts.
   *
   * @throws {Error} If an error occurs
   */
  async initializeRoles(): Promise<Array<ethers.ContractTransactionReceipt>> {
    const transactions: Array<Promise<ethers.ContractTransactionReceipt>> = [];

    // Create contracts
    const pow5Contract: POW5Contract = new POW5Contract(
      this.admin,
      this.addresses.pow5Token,
    );
    const lpPow1Contract: LPPOW1Contract = new LPPOW1Contract(
      this.admin,
      this.addresses.lpPow1Token,
    );
    const lpPow5Contract: LPPOW5Contract = new LPPOW5Contract(
      this.admin,
      this.addresses.lpPow5Token,
    );
    const noPow5Contract: NOPOW5Contract = new NOPOW5Contract(
      this.admin,
      this.addresses.noPow5Token,
    );
    const lpSftContract: LPSFTContract = new LPSFTContract(
      this.admin,
      this.addresses.lpSft,
    );
    const noLpSftContract: NOLPSFTContract = new NOLPSFTContract(
      this.admin,
      this.addresses.noLpSft,
    );
    const pow1LpSftLendFarmContract: POW1LpSftLendFarmContract =
      new POW1LpSftLendFarmContract(
        this.admin,
        this.addresses.pow1LpSftLendFarm,
      );
    const pow5LpSftLendFarmContract: POW5LpSftLendFarmContract =
      new POW5LpSftLendFarmContract(
        this.admin,
        this.addresses.pow5LpSftLendFarm,
      );
    const defiManagerContract: DeFiManagerContract = new DeFiManagerContract(
      this.admin,
      this.addresses.defiManager,
    );
    const pow5InterestFarmContract: POW5InterestFarmContract =
      new POW5InterestFarmContract(this.admin, this.addresses.pow5InterestFarm);

    const roleAssignments: RoleGroup[] = [
      // Dutch Auction
      {
        [this.addresses.pow1LpNftStakeFarm]: [
          {
            role: LPSFT_ISSUER_ROLE,
            contract: lpSftContract,
          },
        ],
        [this.addresses.lpSft]: [
          {
            role: ERC20_ISSUER_ROLE,
            contract: lpPow1Contract,
          },
        ],
      },
      // Yield Harvest
      {
        [this.addresses.yieldHarvest]: [
          {
            role: LPSFT_ISSUER_ROLE,
            contract: noLpSftContract,
          },
          {
            role: LPSFT_FARM_OPERATOR_ROLE,
            contract: pow1LpSftLendFarmContract,
          },
          {
            role: LPSFT_FARM_OPERATOR_ROLE,
            contract: pow5LpSftLendFarmContract,
          },
        ],
      },
      // Liquidity Forge
      {
        [this.addresses.liquidityForge]: [
          {
            role: ERC20_FARM_OPERATOR_ROLE,
            contract: pow5InterestFarmContract,
          },
          {
            role: DEFI_OPERATOR_ROLE,
            contract: defiManagerContract,
          },
        ],
        [this.addresses.defiManager]: [
          {
            role: ERC20_ISSUER_ROLE,
            contract: pow5Contract,
          },
          {
            role: ERC20_ISSUER_ROLE,
            contract: noPow5Contract,
          },
        ],
      },
      // Reverse Repo
      {
        [this.addresses.pow5LpNftStakeFarm]: [
          {
            role: LPSFT_ISSUER_ROLE,
            contract: lpSftContract,
          },
        ],
        [this.addresses.lpSft]: [
          {
            role: ERC20_ISSUER_ROLE,
            contract: lpPow5Contract,
          },
        ],
      },
    ];

    for (const roleGroup of roleAssignments) {
      for (const [address, assignments] of Object.entries(roleGroup)) {
        for (const assignment of assignments) {
          await this.grantRole(
            assignment.contract,
            assignment.role,
            address as `0x${string}`,
            transactions,
          );
        }
      }
    }

    return Promise.all(transactions);
  }

  private async grantRole(
    contract: AccessControlContract,
    role: string,
    address: `0x${string}`,
    transactions: Array<Promise<ethers.ContractTransactionReceipt>>,
  ): Promise<void> {
    if (!(await contract.hasRole(role, address))) {
      transactions.push(contract.grantRole(role, address));
    }
  }
}

export { PermissionManager };

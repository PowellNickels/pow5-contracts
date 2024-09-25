/*
 * Copyright (C) 2024 Powell
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { extractJSONFromURI } from "../../src/utils/lpNftUtils";
import { getAddressBook } from "../hardhat/getAddressBook";
import { AddressBook } from "../interfaces/addressBook";
import { ContractLibrary } from "../interfaces/contractLibrary";
import { AccessControlContract } from "../interfaces/zeppelin/access/accessControlContract";
import { ETH_PRICE, USDC_PRICE } from "../testing/defiMetrics";
import {
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_LPPOW5_USDC_VALUE,
  INITIAL_POW1_SUPPLY,
  INITIAL_POW5_AMOUNT,
  USDC_DECIMALS,
} from "../utils/constants";
import { encodePriceSqrt } from "../utils/fixedMath";
import { getContractLibrary } from "../utils/getContractLibrary";

/**
 * @description The JSON-RPC URL for the Ethereum node
 */
const JSON_RPC_URL: string =
  process.env.JSON_RPC_URL || "http://localhost:8545";

/**
 * @description Entry point for game initialization
 */
async function main(): Promise<void> {
  console.log("Starting game initialization...");

  //////////////////////////////////////////////////////////////////////////////
  // Setup Ethers.js provider and wallets
  //////////////////////////////////////////////////////////////////////////////

  // Connect to the local node
  const provider: ethers.JsonRpcProvider = new ethers.JsonRpcProvider(
    JSON_RPC_URL,
  );

  // Get the deployer wallet
  let deployer: ethers.Signer;

  // Load mnemonic or private key from environment variables or configuration
  const mnemonic: string | undefined = process.env.MNEMONIC;

  if (mnemonic) {
    // Create the deployer wallet using mnemonic
    deployer = ethers.Wallet.fromPhrase(mnemonic).connect(provider);
  } else {
    // Use the first account as the deployer
    deployer = await provider.getSigner(0);
  }

  console.log(`Deployer address: ${await deployer.getAddress()}`);

  // Proceed with the rest of your script using the deployer wallet
  await initializeGame(deployer, provider);
}

/**
 * @description Helper function to initialize the game
 *
 * @param {ethers.Signer} deployer - The deployer wallet
 * @param {ethers.JsonRpcProvider} provider - The Ethers.js provider
 */
async function initializeGame(
  deployer: ethers.Signer,
  provider: ethers.JsonRpcProvider,
): Promise<void> {
  //////////////////////////////////////////////////////////////////////////////
  // Load ABIs and Addresses
  //////////////////////////////////////////////////////////////////////////////

  // Get the current network from the provider
  const network: ethers.Network = await provider.getNetwork();

  // Get the network name
  const networkName: string =
    network.chainId === 1337n || network.chainId === 31337n
      ? "localhost"
      : network.name;

  // Log the chain properties
  console.log("Chain ID:", network.chainId.toString());
  console.log("Chain Name:", networkName);

  // Get the address book for the network
  const addressBook: AddressBook = await getAddressBook(networkName);

  // Instantiate contracts
  const deployerContracts: ContractLibrary = getContractLibrary(
    deployer,
    addressBook,
  );

  // Use deployer for the beneficiary
  const beneficiary: ethers.Signer = deployer;

  //////////////////////////////////////////////////////////////////////////////
  // Define Constants and Parameters
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @description Initial amount of WETH to deposit into the Dutch Auction
   */
  const INITIAL_WETH_AMOUNT: bigint =
    ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

  const INITIAL_USDC_AMOUNT: bigint =
    ethers.parseUnits(INITIAL_LPPOW5_USDC_VALUE.toString(), USDC_DECIMALS) /
    BigInt(USDC_PRICE); // 100 USDC ($100)

  // Define roles
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
  // Grant Roles
  //////////////////////////////////////////////////////////////////////////////

  const transactions: Array<Promise<ethers.ContractTransactionReceipt>> = [];

  {
    const {
      defiManagerContract,
      liquidityForgeContract,
      lpPow1Contract,
      lpPow5Contract,
      lpSftContract,
      noLpSftContract,
      noPow5Contract,
      pow1LpNftStakeFarmContract,
      pow1LpSftLendFarmContract,
      pow5Contract,
      pow5InterestFarmContract,
      pow5LpNftStakeFarmContract,
      pow5LpSftLendFarmContract,
      reverseRepoContract,
      yieldHarvestContract,
    }: ContractLibrary = deployerContracts;

    console.log("Granting roles...");

    // Declarative structure for roles with contracts and addresses
    interface RoleAssignment {
      contract: AccessControlContract;
      address: string;
    }

    const roleAssignments: Record<string, Array<RoleAssignment>> = {
      // ERC20_ISSUER_ROLE
      [ERC20_ISSUER_ROLE]: [
        {
          contract: pow5Contract,
          address: defiManagerContract.address,
        },
        {
          contract: noPow5Contract,
          address: defiManagerContract.address,
        },
        {
          contract: lpPow1Contract,
          address: lpSftContract.address,
        },
        {
          contract: lpPow5Contract,
          address: lpSftContract.address,
        },
      ],
      // LPSFT_ISSUER_ROLE
      [LPSFT_ISSUER_ROLE]: [
        {
          contract: lpSftContract,
          address: pow1LpNftStakeFarmContract.address,
        },
        {
          contract: lpSftContract,
          address: pow5LpNftStakeFarmContract.address,
        },
        {
          contract: noLpSftContract,
          address: yieldHarvestContract.address,
        },
      ],
      // DEFI_OPERATOR_ROLE
      [DEFI_OPERATOR_ROLE]: [
        {
          contract: defiManagerContract,
          address: liquidityForgeContract.address,
        },
      ],
      // ERC20_FARM_OPERATOR_ROLE
      [ERC20_FARM_OPERATOR_ROLE]: [
        {
          contract: pow5InterestFarmContract,
          address: liquidityForgeContract.address,
        },
      ],
      // LPSFT_FARM_OPERATOR_ROLE
      [LPSFT_FARM_OPERATOR_ROLE]: [
        {
          contract: pow1LpSftLendFarmContract,
          address: yieldHarvestContract.address,
        },
        {
          contract: pow5LpSftLendFarmContract,
          address: reverseRepoContract.address,
        },
      ],
    };

    // Loop over the declarative structure to create transactions for granting roles
    for (const [role, assignments] of Object.entries(roleAssignments)) {
      for (const { contract, address } of assignments) {
        if (!(await contract.hasRole(role, address))) {
          transactions.push(contract.grantRole(role, address));
        }
      }
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Initialize Uniswap V3 Pools
  //////////////////////////////////////////////////////////////////////////////

  {
    const {
      pow1Contract,
      pow1PoolContract,
      pow5Contract,
      pow5PoolContract,
      usdcContract,
      wrappedNativeContract,
    } = deployerContracts;

    console.log("Initializing Uniswap V3 pools...");

    // Get POW1 pool token order
    let pow1IsToken0: boolean;
    const pow1Token0: string = (await pow1PoolContract.token0()).toLowerCase();
    const pow1Token1: string = (await pow1PoolContract.token1()).toLowerCase();
    if (
      pow1Token0 === pow1Contract.address.toLowerCase() &&
      pow1Token1 === wrappedNativeContract.address.toLowerCase()
    ) {
      pow1IsToken0 = true;
    } else if (
      pow1Token0 === wrappedNativeContract.address.toLowerCase() &&
      pow1Token1 === pow1Contract.address.toLowerCase()
    ) {
      pow1IsToken0 = false;
    } else {
      throw new Error("POW1 pool tokens are incorrect");
    }
    console.log(`POW1 is ${pow1IsToken0 ? "token0" : "token1"}`);

    // Get POW5 pool token order
    let pow5IsToken0: boolean;
    const pow5Token0: string = (await pow5PoolContract.token0()).toLowerCase();
    const pow5Token1: string = (await pow5PoolContract.token1()).toLowerCase();
    if (
      pow5Token0 === pow5Contract.address.toLowerCase() &&
      pow5Token1 === usdcContract.address.toLowerCase()
    ) {
      pow5IsToken0 = true;
    } else if (
      pow5Token0 === usdcContract.address.toLowerCase() &&
      pow5Token1 === pow5Contract.address.toLowerCase()
    ) {
      pow5IsToken0 = false;
    } else {
      throw new Error("POW5 pool tokens are incorrect");
    }
    console.log(`POW5 is ${pow5IsToken0 ? "token0" : "token1"}`);

    // Check if pools are initialized
    const pow1SqrtPriceX96 = (await pow1PoolContract.slot0()).sqrtPriceX96;
    const pow5SqrtPriceX96 = (await pow5PoolContract.slot0()).sqrtPriceX96;

    if (pow1SqrtPriceX96 !== 0n) {
      console.log("POW1 pool already initialized");
    } else {
      // Initialize the Uniswap V3 pool
      transactions.push(
        pow1PoolContract.initialize(
          encodePriceSqrt(
            pow1IsToken0 ? INITIAL_WETH_AMOUNT : INITIAL_POW1_SUPPLY,
            pow1IsToken0 ? INITIAL_POW1_SUPPLY : INITIAL_WETH_AMOUNT,
          ),
        ),
      );
    }

    if (pow5SqrtPriceX96 !== 0n) {
      console.log("POW5 pool already initialized");
    } else {
      // Initialize the Uniswap V3 pool
      transactions.push(
        pow5PoolContract.initialize(
          encodePriceSqrt(
            pow5IsToken0 ? INITIAL_USDC_AMOUNT : INITIAL_POW5_AMOUNT,
            pow5IsToken0 ? INITIAL_POW5_AMOUNT : INITIAL_USDC_AMOUNT,
          ),
        ),
      );
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  {
    const { dutchAuctionContract, pow1Contract, wrappedNativeContract } =
      deployerContracts;

    // Check if the Dutch Auction is initialized
    const isInitialized: boolean = await dutchAuctionContract.isInitialized();

    if (isInitialized) {
      console.log("Dutch Auction already initialized");
    } else {
      console.log("Initializing Dutch Auction...");

      // Deposit WETH if needed
      const wethBalance: bigint = await wrappedNativeContract.balanceOf(
        await deployer.getAddress(),
      );
      if (wethBalance < INITIAL_WETH_AMOUNT) {
        transactions.push(
          wrappedNativeContract.deposit(INITIAL_WETH_AMOUNT - wethBalance),
        );
      }

      // Approve WETH if needed
      const wethAllowance: bigint = await wrappedNativeContract.allowance(
        await deployer.getAddress(),
        dutchAuctionContract.address,
      );
      if (wethAllowance < INITIAL_WETH_AMOUNT) {
        transactions.push(
          wrappedNativeContract.approve(
            dutchAuctionContract.address,
            INITIAL_WETH_AMOUNT - wethAllowance,
          ),
        );
      }

      // Check POW1 total supply (should be INITIAL_POW1_SUPPLY)
      const pow1TotalSupply: bigint = await pow1Contract.totalSupply();
      if (pow1TotalSupply !== INITIAL_POW1_SUPPLY) {
        console.log(
          `POW1 total supply is not ${INITIAL_POW1_SUPPLY}: ${pow1TotalSupply}`,
        );
      }

      // Check POW1 balance (should be INITIAL_POW1_SUPPLY)
      const pow1Balance: bigint = await pow1Contract.balanceOf(
        await deployer.getAddress(),
      );
      if (pow1Balance !== INITIAL_POW1_SUPPLY) {
        console.log(
          `POW1 balance is not ${INITIAL_POW1_SUPPLY}: ${pow1Balance}`,
        );
      }

      // Approve POW1 if needed
      const pow1Allowance: bigint = await pow1Contract.allowance(
        await deployer.getAddress(),
        dutchAuctionContract.address,
      );
      if (pow1Allowance < INITIAL_POW1_SUPPLY) {
        transactions.push(
          pow1Contract.approve(
            dutchAuctionContract.address,
            INITIAL_POW1_SUPPLY - pow1Allowance,
          ),
        );
      }

      // Execute all transactions
      console.log(`Executing ${transactions.length} transactions...`);
      await Promise.all(transactions);
      transactions.length = 0;

      // Initialize DutchAuction
      transactions.push(
        dutchAuctionContract.initialize(
          INITIAL_POW1_SUPPLY, // gameTokenAmount
          INITIAL_WETH_AMOUNT, // assetTokenAmount
          await beneficiary.getAddress(), // receiver
        ),
      );
    }

    // Execute all transactions
    console.log(`Executing ${transactions.length} transactions...`);
    await Promise.all(transactions);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Inspect LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  {
    const { lpSftContract } = deployerContracts;

    console.log("Inspecting LP-SFT...");

    const tokenIds: bigint[] = await lpSftContract.getTokenIds(
      await beneficiary.getAddress(),
    );

    console.log(
      `LP-SFT token IDs:`,
      tokenIds.map((x) => x),
    );

    if (tokenIds.length > 0) {
      const tokenId: bigint = tokenIds[0];

      // Check token URI
      const nftTokenUri: string = await lpSftContract.uri(tokenId);

      // Content should be valid JSON and structure
      const nftContent = extractJSONFromURI(nftTokenUri);
      if (!nftContent) {
        throw new Error("Failed to extract JSON from URI");
      }
      console.log(`LP-NFT image: ${nftContent.image}`);
    }
  }

  console.log("Game initialization complete.");
}

// Use async/await everywhere and properly handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

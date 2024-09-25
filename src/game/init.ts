/*
 * Copyright (C) 2024 Powell Nickels
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
import { ETH_PRICE } from "../testing/defiMetrics";
import {
  INITIAL_LPPOW1_WETH_VALUE,
  INITIAL_POW1_SUPPLY,
} from "../utils/constants";
import { getContractLibrary } from "../utils/getContractLibrary";
import { DutchAuctionManager } from "./admin/dutchAuctionManager";
import { PermissionManager } from "./admin/permissionManager";
import { PoolManager } from "./admin/poolManager";

////////////////////////////////////////////////////////////////////////////////
// Constants
////////////////////////////////////////////////////////////////////////////////

/**
 * @description The JSON-RPC URL for the Ethereum node
 */
const JSON_RPC_URL: string =
  process.env.JSON_RPC_URL || "http://localhost:8545";

/**
 * @description Initial amount of WETH to deposit into the Dutch Auction
 */
const INITIAL_WETH_AMOUNT: bigint =
  ethers.parseEther(INITIAL_LPPOW1_WETH_VALUE.toString()) / BigInt(ETH_PRICE); // $100 in ETH

////////////////////////////////////////////////////////////////////////////////
// Entry point
////////////////////////////////////////////////////////////////////////////////

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
  // Get Signers
  //////////////////////////////////////////////////////////////////////////////

  const deployerAddress: `0x${string}` =
    (await deployer.getAddress()) as `0x${string}`;
  console.log(`Deployer address: ${deployerAddress}`);

  // Use deployer for the beneficiary
  const beneficiary: ethers.Signer = deployer;
  const beneficiaryAddress: `0x${string}` =
    (await beneficiary.getAddress()) as `0x${string}`;

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

  //////////////////////////////////////////////////////////////////////////////
  // Initialize Uniswap V3 Pools
  //////////////////////////////////////////////////////////////////////////////

  const poolManager: PoolManager = new PoolManager(deployer, {
    pow1Token: addressBook.pow1Token!,
    marketToken: addressBook.wrappedNativeToken!,
    pow1MarketPool: addressBook.pow1MarketPool!,
    pow5Token: addressBook.pow5Token!,
    stableToken: addressBook.usdcToken!,
    pow5StablePool: addressBook.pow5StablePool!,
  });

  const poolTransactions: Promise<Array<ethers.ContractTransactionReceipt>> =
    poolManager.initializePools();

  //////////////////////////////////////////////////////////////////////////////
  // Grant Roles
  //////////////////////////////////////////////////////////////////////////////

  const permissionManager: PermissionManager = new PermissionManager(deployer, {
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
  });

  const roleTransactions: Promise<Array<ethers.ContractTransactionReceipt>> =
    permissionManager.initializeRoles();

  //////////////////////////////////////////////////////////////////////////////
  // Initialize Dutch Auction
  //////////////////////////////////////////////////////////////////////////////

  const dutchAuctionManager: DutchAuctionManager = new DutchAuctionManager(
    deployer,
    {
      pow1Token: addressBook.pow1Token!,
      marketToken: addressBook.wrappedNativeToken!,
      dutchAuction: addressBook.dutchAuction!,
    },
  );

  let initializeTx: Promise<ethers.ContractTransactionReceipt> | null = null;

  // Check if the Dutch Auction is initialized
  const isInitialized: boolean = await dutchAuctionManager.isInitialized();
  if (isInitialized) {
    console.log("Dutch Auction already initialized");
  } else {
    console.log("Initializing Dutch Auction...");

    // Initialize DutchAuction
    initializeTx = dutchAuctionManager.initialize(
      poolTransactions,
      roleTransactions,
      INITIAL_POW1_SUPPLY,
      INITIAL_WETH_AMOUNT,
      beneficiaryAddress,
    );
  }

  // Check if initial LP-NFTs have been minted
  const auctionCount: number =
    await dutchAuctionManager.getCurrentAuctionCount();
  if (auctionCount > 0) {
    console.log("Initial LP-NFTs already minted");
  } else {
    console.log("Creating initial LP-NFTs for sale...");

    // Create initial LP-NFTs for sale
    await dutchAuctionManager.createInitialAuctions(initializeTx);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Inspect LP-SFT
  //////////////////////////////////////////////////////////////////////////////

  {
    const { lpSftContract } = deployerContracts;

    console.log("Inspecting LP-SFT...");

    const tokenIds: bigint[] =
      await lpSftContract.getTokenIds(beneficiaryAddress);

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

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import chai from "chai";
import dotenv from "dotenv";
import { ethers } from "ethers";

import { LPSFT_CONTRACT } from "../../src/hardhat/contracts/dapp";
import { AddressBook } from "../../src/interfaces/addressBook";
import { LPSFTContract } from "../../src/interfaces/token/erc1155/lpSftContract";
import testnet from "../../src/networks/testnet.json";
import { extractJSONFromURI } from "../../src/utils/lpNftUtils";

// Load environment variables from .env
dotenv.config();

//
// Constants
//

// The Web Socket URL for the Ethereum node
const WEB_SOCKET_URL: string =
  process.env.WEB_SOCKET_URL || "ws://localhost:8545";

// Token ID of initial LP-NFT/L-SFT
const POW1_LPNFT_TOKEN_ID: bigint = 1n;

// Testnet network name
const TESTNET_NETWORK_NAME: string = "testnet";

// Debug option to print the LP-NFT's image data URI
const DEBUG_PRINT_LPNFT_IMAGE: boolean = true;

//
// Types
//

interface ContractExport {
  contracts: {
    [contractName: string]: {
      address: `0x${string}`;
    };
  };
}

const EXPORTS: Record<string, ContractExport> = {
  testnet: testnet as ContractExport,
};

//
// Test cases
//

describe("Testnet NFT Art", () => {
  //////////////////////////////////////////////////////////////////////////////
  // Fixture state
  //////////////////////////////////////////////////////////////////////////////

  let addressBook: AddressBook = {};
  let webSocketProvider: ethers.WebSocketProvider;

  //////////////////////////////////////////////////////////////////////////////
  // Mocha setup
  //////////////////////////////////////////////////////////////////////////////

  before(async function (): Promise<void> {
    this.timeout(60 * 1000);

    // Create web socket provider
    webSocketProvider = new ethers.WebSocketProvider(WEB_SOCKET_URL);

    // Load testnet exports
    const contracts: {
      [contractName: string]: {
        address: `0x${string}`;
      };
    } = EXPORTS[TESTNET_NETWORK_NAME]["contracts"];

    // Populate address book
    addressBook = {
      lpSft: contracts[LPSFT_CONTRACT]["address"],
    };
  });

  //////////////////////////////////////////////////////////////////////////////
  // Log Chain ID
  //////////////////////////////////////////////////////////////////////////////

  it("should log the chain ID", async function (): Promise<void> {
    // Use eth_chainId to get the chain ID
    const chainIdHex: string = await webSocketProvider.send("eth_chainId", []);

    // Convert hex to decimal
    const chainId = parseInt(chainIdHex, 16);

    console.log(`    Testnet Chain ID: ${chainId}`);
  });

  //////////////////////////////////////////////////////////////////////////////
  // Spec: Check LP-SFT properties
  //////////////////////////////////////////////////////////////////////////////

  it("should check LP-SFT properties", async function (): Promise<void> {
    // Create contract
    const lpSftContract: LPSFTContract = new LPSFTContract(
      webSocketProvider,
      addressBook.lpSft!,
    );

    // Check total supply
    const totalSupply: bigint = await lpSftContract.totalSupply();
    chai.expect(totalSupply).to.equal(1n);
  });

  it("should check POW1 LP-SFT properties", async function (): Promise<void> {
    this.timeout(10 * 1000);

    // Create contract
    const lpSftContract: LPSFTContract = new LPSFTContract(
      webSocketProvider,
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

    if (DEBUG_PRINT_LPNFT_IMAGE) {
      console.log(`    LP-NFT image: ${nftContent.image}`);
    }
  });
});

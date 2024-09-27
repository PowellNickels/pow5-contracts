/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

/**
 * @description A base class for all contract wrappers, storing the contract
 * address and signer
 */
class BaseContract {
  /**
   * @description The address of the contract
   */
  public address: string;

  /**
   * @description The signer used to interact with the blockchain
   */
  protected signer: ethers.Signer;

  /**
   * @constructor
   * @param {ethers.Signer} signer - The signer instance to interact with the contract
   * @param {string} contractAddress - The address of the contract
   */
  constructor(signer: ethers.Signer, contractAddress: string) {
    this.signer = signer;
    this.address = contractAddress;
  }
}

export { BaseContract };

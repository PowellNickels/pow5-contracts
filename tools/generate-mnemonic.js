/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

const { Wallet } = require("ethers");

function generateMnemonic() {
  const wallet = Wallet.createRandom();
  const mnemonic = wallet.mnemonic.phrase;
  console.log(`Mnemonic: ${mnemonic}`);
}

generateMnemonic();

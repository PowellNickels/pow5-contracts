/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {IERC1155Enumerable} from "./extensions/IERC1155Enumerable.sol";
import {ILPSFTIssuable} from "./extensions/ILPSFTIssuable.sol";

/**
 * @dev LP-SFT debt interface
 */
interface INOLPSFT is IERC1155Enumerable, ILPSFTIssuable {}

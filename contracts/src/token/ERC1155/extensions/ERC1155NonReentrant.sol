/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * This file is derived from the OpenZeppelin project under the MIT license.
 * Copyright (c) 2016-2024 Zeppelin Group Ltd and contributors
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND MIT
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.25;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

import {MultipleReentrancyGuard} from "../../../utils/MultipleReentrancyGuard.sol";

/**
 * @title ERC-1155: Multi Token Standard, non-reentrant extension
 *
 * This abstract contract extends the OpenZeppelin ERC-1155 implementation by
 * incorporating the MultipleReentrancyGuard to enhance security.
 */
abstract contract ERC1155NonReentrant is MultipleReentrancyGuard, ERC1155 {}

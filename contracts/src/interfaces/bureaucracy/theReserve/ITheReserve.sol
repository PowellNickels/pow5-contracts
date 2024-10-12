/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";

import {ITheReserveRoutes} from "./ITheReserveRoutes.sol";

interface ITheReserve is IERC165, ITheReserveRoutes {}

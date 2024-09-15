/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * This file is derived from the Ultrachess project under the Apache 2.0 license.
 * Copyright (C) 2022-2023 Ultrachess team
 *
 * SPDX-License-Identifier: GPL-3.0-or-later AND Apache-2.0
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.27;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import {IERC20Issuable} from "../../../interfaces/token/ERC20/extensions/IERC20Issuable.sol";

/**
 * @title ERC-20: Token Standard, optional issuable extension
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-20
 */
abstract contract ERC20Issuable is AccessControl, ERC20, IERC20Issuable {
  //////////////////////////////////////////////////////////////////////////////
  // Roles
  //////////////////////////////////////////////////////////////////////////////

  // Only ERC20_ISSUER_ROLE can mint and destroy tokens
  bytes32 public constant ERC20_ISSUER_ROLE = "ERC20_ISSUER_ROLE";

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl} and {IERC20Issuable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(AccessControl, IERC165) returns (bool) {
    return
      AccessControl.supportsInterface(interfaceId) ||
      interfaceId == type(IERC20).interfaceId ||
      interfaceId == type(IERC20Metadata).interfaceId ||
      interfaceId == type(IERC20Issuable).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC20Issuable}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC20Issuable-mint}
   */
  function mint(address to, uint256 amount) external {
    // Validate access
    _checkRole(ERC20_ISSUER_ROLE);

    // Call ancestor
    _mint(to, amount);
  }

  /**
   * @dev See {IERC20Issuable-burn}
   */
  function burn(address account, uint256 amount) external {
    // Validate access
    _checkRole(ERC20_ISSUER_ROLE);

    // Call ancestor
    _burn(account, amount);
  }
}

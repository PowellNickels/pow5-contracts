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

/**
 * @dev Contract module that helps prevent reentrant calls to a function
 *
 * This file adapts OpenZeppelin's ReentrancyGuard.sol (last updated v5.0.0)
 * to support polymorphism, enabling nonreentrant functions across different
 * contracts in the inheritance hierarchy to safely call other nonreentrant
 * functions without risk of reentrancy attacks.
 *
 * This adaptation uses a unique identifier for each function to manage
 * reentrancy status, providing fine-grained control over reentrancy locks.
 *
 * TIP: If you would like to learn more about reentrancy and alternative ways
 * to protect against it, check out the blog post:
 *
 * https://blog.openzeppelin.com/reentrancy-after-istanbul/[Reentrancy After Istanbul]
 */
contract MultipleReentrancyGuard {
  /**
   * @dev Mapping of function call identifiers to their reentrancy status
   *
   * Each identifier is a keccak256 hash of the contract's address and the
   * function's signature (`msg.sig`).
   *
   * This mapping ensures unique reentrancy checks per function, using boolean
   * values where `true` indicates that the function is currently executing
   * and is thus protected against re-entry, while `false` signifies that the
   * function is not active, safeguarding against reentrancy attacks.
   */
  mapping(bytes32 key => bool entered) private _statuses;

  /**
   * @dev Unauthorized reentrant call
   *
   * This error is thrown when a `nonReentrant` function is invoked from
   * another `nonReentrant` function in a manner that violates the reentrancy
   * guard's policy, potentially leading to hazards such as reentrancy attacks.
   */
  error ReentrancyGuardReentrantCall();

  /**
   * @dev Prevents a function from calling itself, directly or indirectly
   */
  modifier nonReentrant(bytes4 interfaceId) {
    /*
     * By including msg.sig as part of the key in the reentrancy checks, we
     * can ensure that the reentrancy status is managed on a per-function
     * basis. This prevents cross-function reentrancy issues where entering
     * a guarded state in one function could improperly block or execution
     * in another.
     */
    bytes32 key = keccak256(
      abi.encodePacked(address(this), msg.sig, interfaceId)
    );

    _nonReentrantBefore(key);
    _;
    _nonReentrantAfter(key);
  }

  /**
   * @dev Checks and sets the reentrancy guard for the provided key, preventing
   * reentry
   */
  function _nonReentrantBefore(bytes32 key) private {
    // On the first call to nonReentrant for a given key, _statuses[key] will
    // be false
    if (_statuses[key]) {
      revert ReentrancyGuardReentrantCall();
    }

    // Any calls to nonReentrant with the given key after this point will fail
    _statuses[key] = true;
  }

  /**
   * @dev Resets the reentrancy guard for the provided key, allowing future
   * entry
   */
  function _nonReentrantAfter(bytes32 key) private {
    // Reset the status for the key
    _statuses[key] = false;
  }

  /**
   * @dev Returns true if the reentrancy guard is currently set to "entered",
   * which indicates there is a `nonReentrant` function in the call stack.
   */
  function _reentrancyGuardEntered(bytes32 key) internal view returns (bool) {
    return _statuses[key];
  }
}

/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {ILPNFT} from "../../interfaces/token/ERC1155/ILPNFT.sol";

/**
 * @title LP-NFT: Liquidity Pool Non-Fungible Token
 */
contract LPNFT is Context, AccessControl, ILPNFT {
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1 token contract
   */
  IERC20 public immutable pow1Token;

  /**
   * @dev The POW5 token contract
   */
  IERC20 public immutable pow5Token;

  /**
   * @dev The LPPOW1 token contract
   */
  IERC20 public immutable lpPow1Token;

  /**
   * @dev The LPPOW5 token contract
   */
  IERC20 public immutable lpPow5Token;

  /**
   * @dev The NOPOW5 token contract
   */
  IERC20 public immutable noPow5Token;

  /**
   * @dev The Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  //////////////////////////////////////////////////////////////////////////////
  // State
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-NFT's token ID
   */
  uint256 private _tokenId;

  /**
   * @dev Enum for which pool the LP-NFT belongs to, either LPPOW1 or LPPOW5
   */
  Pool private _pool;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the LP-NFT template
   *
   * @param pow1Token_ The POW1 token
   * @param pow5Token_ The POW5 token
   * @param lpPow1Token_ The LPPOW1 token
   * @param lpPow5Token_ The LPPOW5 token
   * @param noPow5Token_ The NOPOW5 token
   * @param uniswapV3NftManager_ The Uniswap V3 NFT manager
   */
  constructor(
    address pow1Token_,
    address pow5Token_,
    address lpPow1Token_,
    address lpPow5Token_,
    address noPow5Token_,
    address uniswapV3NftManager_
  ) {
    // Validate parameters
    require(pow1Token_ != address(0), "Invalid POW1");
    require(pow5Token_ != address(0), "Invalid POW5");
    require(lpPow1Token_ != address(0), "Invalid LPPOW1");
    require(lpPow5Token_ != address(0), "Invalid LPPOW5");
    require(noPow5Token_ != address(0), "Invalid NOPOW5");
    require(uniswapV3NftManager_ != address(0), "Invalid NFT mgr");

    // Initialize routes
    pow1Token = IERC20(pow1Token_);
    pow5Token = IERC20(pow5Token_);
    lpPow1Token = IERC20(lpPow1Token_);
    lpPow5Token = IERC20(lpPow5Token_);
    noPow5Token = IERC20(noPow5Token_);
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);

    // Initialize state
    _pool = Pool.INVALID;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl} and {ILPNFT}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) public view virtual override(AccessControl, IERC165) returns (bool) {
    return
      AccessControl.supportsInterface(interfaceId) ||
      interfaceId == type(ILPNFT).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ILPNFT}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ILPNFT-initialize}
   */
  function initialize(uint256 lpNftTokenId) public override {
    // Validate parameters
    if (lpNftTokenId == 0) {
      revert LPNFTInvalidTokenID();
    }

    // Validate state
    if (_tokenId != 0 || _pool != Pool.INVALID) {
      revert LPNFTReinitializationNotAllowed();
    }

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, _msgSender());

    // Update state
    _tokenId = lpNftTokenId;

    // Determine the pool
    address token0;
    address token1;
    // slither-disable-next-line unused-return
    (, , token0, token1, , , , , , , , ) = uniswapV3NftManager.positions(
      lpNftTokenId
    );

    if (token0 == address(pow1Token) || token1 == address(pow1Token)) {
      _pool = Pool.LPPOW1;
    } else if (token0 == address(pow5Token) || token1 == address(pow5Token)) {
      _pool = Pool.LPPOW5;
    } else {
      revert LPNFTInvalidPool();
    }
  }

  /**
   * @dev See {ILPNFT-deinitialize}
   */
  function deinitialize(address beneficiary) public override {
    // Validate access
    _checkRole(DEFAULT_ADMIN_ROLE);

    // Validate parameters
    require(beneficiary != address(0), "Invalid beneficiary");

    // Read state
    uint256 lpNftTokenId = _tokenId;

    // Validate state
    if (lpNftTokenId == 0) {
      revert LPNFTAlreadyDeinitialized();
    }

    // Recover ETH
    uint256 ethBalance = address(this).balance;
    if (ethBalance > 0) {
      // slither-disable-next-line arbitrary-send-eth
      payable(beneficiary).transfer(ethBalance);
    }

    // Recover POW1
    uint256 recoveredPow1Balance = pow1Token.balanceOf(address(this));
    if (recoveredPow1Balance > 0) {
      pow1Token.safeTransfer(beneficiary, recoveredPow1Balance);
    }

    // Recover POW5
    uint256 recoveredPow5Balance = pow5Token.balanceOf(address(this));
    if (recoveredPow5Balance > 0) {
      pow5Token.safeTransfer(beneficiary, recoveredPow5Balance);
    }

    // Emit event
    //emit LPNFTDeinitialized(lpNftTokenId, pool);
  }

  /**
   * @dev See {ILPNFT-tokenId}
   */
  function tokenId() public view override returns (uint256) {
    // Read state
    return _tokenId;
  }

  /**
   * @dev See {ILPNFT-uri}
   */
  function uri() public view override returns (string memory) {
    // Validate state
    if (_tokenId == 0) {
      revert LPNFTInvalidTokenID();
    }

    // Read external state
    return uniswapV3NftManager.tokenURI(_tokenId);
  }

  /**
   * @dev See {ILPNFT-pool}
   */
  function pool() public view override returns (Pool) {
    // Read state
    return _pool;
  }

  /**
   * @dev See {ILPNFT-pow1Balance}
   */
  function pow1Balance() public view override returns (uint256) {
    // Read external state
    return pow1Token.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-pow5Balance}
   */
  function pow5Balance() public view override returns (uint256) {
    // Read external state
    return pow5Token.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-lpPow1Balance}
   */
  function lpPow1Balance() public view override returns (uint256) {
    // Read external state
    return lpPow1Token.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-lpPow5Balance}
   */
  function lpPow5Balance() public view override returns (uint256) {
    // Read external state
    return lpPow5Token.balanceOf(address(this));
  }

  /**
   * @dev See {ILPNFT-noPow5Balance}
   */
  function noPow5Balance() public view override returns (uint256) {
    // Read external state
    return noPow5Token.balanceOf(address(this));
  }
}

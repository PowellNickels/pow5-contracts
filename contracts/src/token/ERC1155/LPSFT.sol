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
import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Arrays} from "@openzeppelin/contracts/utils/Arrays.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

import {INonfungiblePositionManager} from "../../../interfaces/uniswap-v3-periphery/INonfungiblePositionManager.sol";

import {ILPNFT} from "../../interfaces/token/ERC1155/ILPNFT.sol";
import {ILPSFT} from "../../interfaces/token/ERC1155/ILPSFT.sol";
import {IERC20Issuable} from "../../interfaces/token/ERC20/extensions/IERC20Issuable.sol";

import {ERC1155Enumerable} from "./extensions/ERC1155Enumerable.sol";
import {ERC1155NonReentrant} from "./extensions/ERC1155NonReentrant.sol";
import {LPNFTHolder} from "./extensions/LPNFTHolder.sol";
import {LPSFTIssuable} from "./extensions/LPSFTIssuable.sol";

/**
 * @title ERC-1155: Multi Token Standard implementation
 *
 * @dev See https://eips.ethereum.org/EIPS/eip-1155
 */
contract LPSFT is
  AccessControl,
  ERC1155NonReentrant,
  ERC1155Enumerable,
  LPSFTIssuable,
  LPNFTHolder,
  ILPSFT
{
  using Arrays for uint256[];
  using SafeERC20 for IERC20;

  //////////////////////////////////////////////////////////////////////////////
  // Roles
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Role allowing transfer of tokens
   */
  bytes32 public constant LPSFT_OPERATOR_ROLE = "LPSFT_OPERATOR_ROLE";

  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The POW1 token
   */
  IERC20 public immutable pow1Token;

  /**
   * @dev The POW5 token
   */
  IERC20 public immutable pow5Token;

  /**
   * @dev The LP POW1 token
   */
  IERC20Issuable public lpPow1Token;

  /**
   * @dev The LP POW5 token
   */
  IERC20Issuable public lpPow5Token;

  /**
   * @dev The Uniswap V3 NFT manager
   */
  INonfungiblePositionManager public immutable uniswapV3NftManager;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the ERC-1155 contract
   *
   * @param owner_ The owner of the ERC-1155 contract
   * @param lpNftTemplate_ The LP-NFT contract used for clones
   * @param uniswapV3NftManager_ The Uniswap V3 NFT manager
   */
  constructor(
    address owner_,
    address lpNftTemplate_,
    address pow1Token_,
    address pow5Token_,
    address lpPow1Token_,
    address lpPow5Token_,
    address uniswapV3NftManager_
  ) ERC1155("") LPNFTHolder(lpNftTemplate_) {
    // Validate parameters
    require(owner_ != address(0), "Invalid owner");
    require(pow1Token_ != address(0), "Invalid POW1");
    require(pow5Token_ != address(0), "Invalid POW5");
    require(lpPow1Token_ != address(0), "Invalid LPPOW1");
    require(lpPow5Token_ != address(0), "Invalid LPPOW5");
    require(
      uniswapV3NftManager_ != address(0),
      "Invalid Uniswap V3 NFT manager"
    );

    // Initialize {AccessControl}
    _grantRole(DEFAULT_ADMIN_ROLE, owner_);

    // Initialize routes
    pow1Token = IERC20(pow1Token_);
    pow5Token = IERC20(pow5Token_);
    lpPow1Token = IERC20Issuable(lpPow1Token_);
    lpPow5Token = IERC20Issuable(lpPow5Token_);
    uniswapV3NftManager = INonfungiblePositionManager(uniswapV3NftManager_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {AccessControl}, {ERC1155NonReentrant},
  // {ERC1155Enumerable}, {LPSFTIssuable}, {LPNFTHolder} and {ILPSFT}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  )
    public
    view
    virtual
    override(
      AccessControl,
      ERC1155Enumerable,
      LPSFTIssuable,
      LPNFTHolder,
      ERC1155,
      IERC165
    )
    returns (bool)
  {
    return
      super.supportsInterface(interfaceId) ||
      interfaceId == type(ILPSFT).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC1155MetadataURI} via {ERC1155NonReentrant},
  // {ERC1155Enumerable}, {LSFTIssuable} and {LPNFTHolder}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC1155MetadataURI-uri}
   */
  function uri(
    uint256 id
  ) public view virtual override returns (string memory) {
    // Validate parameters
    if (id == 0) {
      revert ILPNFT.LPNFTInvalidTokenID();
    }

    // Read state
    ILPNFT token = _tokenIdToToken[id];

    // Validate state
    if (address(token) == address(0)) {
      revert LPSFTInvalidToken(id);
    }

    // Read external state
    return token.uri();
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {ERC1155} via {ERC1155NonReentrant}, {ERC1155Enumerable},
  // {LSFTIssuable} and {LPNFTHolder}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {ERC1155-_update}
   */
  function _update(
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory values
  )
    internal
    virtual
    override(ERC1155, ERC1155Enumerable, LPNFTHolder)
    nonReentrantLPSFT
  {
    // Translate parameters
    uint256 tokenCount = ids.length;

    // Check if burning
    if (to == address(0)) {
      // Handle burning
      for (uint256 i = 0; i < tokenCount; i++) {
        // Translate parameter
        uint256 tokenId = ids.unsafeMemoryAccess(i);

        // Read state
        address tokenAddress = tokenIdToAddress(tokenId);

        // Validate state
        if (tokenAddress == address(0)) {
          revert LPSFTInvalidToken(tokenId);
        }

        // Read all pool balances
        uint256 lpPow1Balance_ = lpPow1Token.balanceOf(tokenAddress);
        uint256 lpPow5Balance_ = lpPow5Token.balanceOf(tokenAddress);

        // Burn all pool balances
        if (lpPow1Balance_ > 0) {
          // slither-disable-next-line reentrancy-no-eth
          lpPow1Token.burn(tokenAddress, lpPow1Balance_);
        }
        if (lpPow5Balance_ > 0) {
          // slither-disable-next-line reentrancy-no-eth
          lpPow5Token.burn(tokenAddress, lpPow5Balance_);
        }
      }
    }

    // Call ancestors
    // slither-disable-next-line reentrancy-events
    super._update(from, to, ids, values);

    // Check if minting
    if (from == address(0)) {
      // Handle minting
      for (uint256 i = 0; i < tokenCount; i++) {
        // Translate parameter
        uint256 tokenId = ids.unsafeMemoryAccess(i);

        // Read state
        address tokenAddress = tokenIdToAddress(tokenId);

        // Validate state
        if (tokenAddress == address(0)) {
          revert LPSFTInvalidToken(tokenId);
        }

        // Read state
        address token0;
        address token1;
        uint128 uniV3LiquidityAmount;
        // slither-disable-next-line unused-return
        (
          ,
          ,
          token0,
          token1,
          ,
          ,
          ,
          uniV3LiquidityAmount,
          ,
          ,
          ,

        ) = uniswapV3NftManager.positions(tokenId);

        // Translate state
        uint256 liquidityAmount = SafeCast.toUint256(
          SafeCast.toInt256(uniV3LiquidityAmount)
        );

        // Increase LP token balance
        if (token0 == address(pow1Token) || token1 == address(pow1Token)) {
          lpPow1Token.mint(tokenAddress, liquidityAmount);
        } else if (
          token0 == address(pow5Token) || token1 == address(pow5Token)
        ) {
          lpPow5Token.mint(tokenAddress, liquidityAmount);
        }
      }
    }

    // If any tokens were returned to the contract after burning the LP-SFT,
    // transfer them to the sender
    if (to == address(0)) {
      uint256 pow1Balance = pow1Token.balanceOf(address(this));
      uint256 pow5Balance = pow5Token.balanceOf(address(this));

      if (pow1Balance > 0) {
        pow1Token.safeTransfer(from, pow1Balance);
      }
      if (pow5Balance > 0) {
        pow5Token.safeTransfer(from, pow5Balance);
      }
    }
  }
}

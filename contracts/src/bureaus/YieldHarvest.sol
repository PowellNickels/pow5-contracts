/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

pragma solidity 0.8.25;

import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import {IERC1155Receiver} from "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {IYieldHarvest} from "../interfaces/bureaus/IYieldHarvest.sol";
import {IDeFiManager} from "../interfaces/defi/IDeFiManager.sol";
import {ILPSFTLendFarm} from "../interfaces/defi/ILPSFTLendFarm.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";

/**
 * @title Bureau of the Yield Harvest
 */
contract YieldHarvest is Context, ReentrancyGuard, IYieldHarvest {
  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-SFT contract
   */
  ILPSFT public immutable lpSft;

  /**
   * @dev The LP-SFT lend farm
   */
  ILPSFTLendFarm public immutable lpSftLendFarm;

  /**
   * @dev The DeFi interface for LP-SFTs
   */
  IDeFiManager public immutable defiManager;

  //////////////////////////////////////////////////////////////////////////////
  // Initialization
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev Initializes the Yield Harvest contract
   *
   * @param lpSft_ The LP-SFT token contract
   * @param lpSftLendFarm_ The LP-SFT lend farm
   * * @param defiManager_ The address of the LP-SFT DeFi manager
   */
  constructor(address lpSft_, address lpSftLendFarm_, address defiManager_) {
    // Validate parameters
    require(lpSft_ != address(0), "Invalid LP-SFT");
    require(lpSftLendFarm_ != address(0), "Invalid farm");
    require(defiManager_ != address(0), "Invalid DeFi mgr");

    // Initialize routes
    lpSft = ILPSFT(lpSft_);
    lpSftLendFarm = ILPSFTLendFarm(lpSftLendFarm_);
    defiManager = IDeFiManager(defiManager_);
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IERC165} via {IYieldHarvest}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC165-supportsInterface}
   */
  function supportsInterface(
    bytes4 interfaceId
  ) external pure override returns (bool) {
    return interfaceId == type(IYieldHarvest).interfaceId;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Implementation of {IYieldHarvest}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IYieldHarvest-lendLpSft}
   */
  function lendLpSft(uint256 tokenId) external override nonReentrant {
    // Validate ownership
    require(lpSft.ownerOf(tokenId) == _msgSender(), "Not owner");

    // Call external contracts
    lpSftLendFarm.lendLpSft(tokenId);
    defiManager.setBorrower(tokenId, address(this));
  }

  /**
   * @dev See {IYieldHarvest-withdrawLpSft}
   */
  function withdrawLpSft(uint256 tokenId) external override nonReentrant {
    // Validate ownership
    require(lpSft.ownerOf(tokenId) == _msgSender(), "Not owner");

    // Validate POW5 loan is paid back
    require(defiManager.noPow5Balance(tokenId) == 0, "Unpaid POW5 loan");

    // Call external contracts
    lpSftLendFarm.withdrawLpSft(tokenId);
    defiManager.setBorrower(tokenId, address(0));
  }
}

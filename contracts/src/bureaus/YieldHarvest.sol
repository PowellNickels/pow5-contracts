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
import {ILPSFTIssuable} from "../interfaces/token/ERC1155/extensions/ILPSFTIssuable.sol";
import {ILPSFT} from "../interfaces/token/ERC1155/ILPSFT.sol";
import {ERC1155Utils} from "../token/ERC1155/utils/ERC1155Utils.sol";

/**
 * @title Bureau of the Yield Harvest
 */
contract YieldHarvest is Context, ReentrancyGuard, ERC1155Utils, IYieldHarvest {
  //////////////////////////////////////////////////////////////////////////////
  // Routes
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev The LP-SFT contract
   */
  ILPSFT public immutable lpSft;

  /**
   * @dev The LP-SFT debt contract
   */
  ILPSFTIssuable public immutable noLpSft;

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
   * @param noLpSft_ The No-LP-SFT token contract
   * @param lpSftLendFarm_ The LP-SFT lend farm
   * * @param defiManager_ The address of the LP-SFT DeFi manager
   */
  constructor(
    address lpSft_,
    address noLpSft_,
    address lpSftLendFarm_,
    address defiManager_
  ) {
    // Validate parameters
    require(lpSft_ != address(0), "Invalid LP-SFT");
    require(noLpSft_ != address(0), "Invalid No-LP-SFT");
    require(lpSftLendFarm_ != address(0), "Invalid farm");
    require(defiManager_ != address(0), "Invalid DeFi mgr");

    // Initialize routes
    lpSft = ILPSFT(lpSft_);
    noLpSft = ILPSFTIssuable(noLpSft_);
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
  // Implementation of {IERC1155Receiver} via {IYieldHarvest}
  //////////////////////////////////////////////////////////////////////////////

  /**
   * @dev See {IERC1155Receiver-onERC1155Received}
   */
  function onERC1155Received(
    address,
    address from,
    uint256 id,
    uint256 value,
    bytes memory data
  ) external override returns (bytes4) {
    // Validate sender
    require(
      _msgSender() == address(lpSft) || _msgSender() == address(noLpSft),
      "Only (NO)LPSFT accepted"
    );

    // Validate parameters
    require(value == 1, "Only NFTs");
    require(from != address(0), "Invalid sender");

    if (_msgSender() == address(lpSft)) {
      // Call external contracts
      lpSftLendFarm.lendLpSft(id);
      noLpSft.mint(from, id, data);
    } else {
      // Verify no POW5 debt
      require(defiManager.noPow5Balance(id) == 0, "NOPOW5 must be 0");

      // Call external contracts
      noLpSft.burn(address(this), id);
      lpSftLendFarm.withdrawLpSft(id);
      lpSft.safeTransferFrom(address(this), from, id, 1, data);
    }

    // Satisfy IERC1155Receiver requirement
    return this.onERC1155Received.selector;
  }

  /**
   * @dev See {IERC1155Receiver-onERC1155BatchReceived}
   */
  function onERC1155BatchReceived(
    address,
    address from,
    uint256[] memory ids,
    uint256[] memory values,
    bytes memory data
  ) external override returns (bytes4) {
    // Validate sender
    require(
      _msgSender() == address(lpSft) || _msgSender() == address(noLpSft),
      "Only (NO)LPSFT accepted"
    );

    // Validate parameters
    require(from != address(0), "Invalid sender");
    ERC1155Utils.checkAmountArray(ids, values);

    if (_msgSender() == address(lpSft)) {
      // Call external contracts
      lpSftLendFarm.lendLpSftBatch(ids);
      noLpSft.mintBatch(from, ids, data);
    } else {
      lpSftLendFarm.withdrawLpSftBatch(ids);
      noLpSft.burnBatch(address(this), ids);
      lpSft.safeBatchTransferFrom(address(this), from, ids, values, data);
    }

    // Satisfy IERC1155Receiver requirement
    return this.onERC1155BatchReceived.selector;
  }
}

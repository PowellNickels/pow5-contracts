/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import {
  ContractTransactionReceipt,
  ContractTransactionResponse,
  Signer,
} from "ethers";

import { IAccessControl } from "../../../types/@openzeppelin/contracts/access/IAccessControl";
import { IAccessControl__factory } from "../../../types/factories/@openzeppelin/contracts/access/IAccessControl__factory";

// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
function AccessControlMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private accessControl: IAccessControl;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [Signer, string];
      this.accessControl = IAccessControl__factory.connect(
        contractAddress,
        signer,
      );
    }

    async hasRole(role: string, account: string): Promise<boolean> {
      return await this.accessControl.hasRole(role, account);
    }

    async getRoleAdmin(role: string): Promise<string> {
      return await this.accessControl.getRoleAdmin(role);
    }

    async grantRole(
      role: string,
      account: string,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse =
        await this.accessControl.grantRole(role, account);
      return (await tx.wait()) as ContractTransactionReceipt;
    }

    async revokeRole(
      role: string,
      account: string,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse =
        await this.accessControl.revokeRole(role, account);
      return (await tx.wait()) as ContractTransactionReceipt;
    }

    async renounceRole(
      role: string,
      callerConfirmation: string,
    ): Promise<ContractTransactionReceipt> {
      const tx: ContractTransactionResponse =
        await this.accessControl.renounceRole(role, callerConfirmation);
      return (await tx.wait()) as ContractTransactionReceipt;
    }
  };
}

export { AccessControlMixin };

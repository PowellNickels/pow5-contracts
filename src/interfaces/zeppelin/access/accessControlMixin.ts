/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { ethers } from "ethers";

import { IAccessControl } from "../../../types/@openzeppelin/contracts/access/IAccessControl";
import { IAccessControl__factory } from "../../../types/factories/@openzeppelin/contracts/access/IAccessControl__factory";
import { BaseMixin } from "../../baseMixin";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function AccessControlMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends BaseMixin(Base) {
    private accessControl: IAccessControl;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);

      const [contractRunner, contractAddress] = args as [
        ethers.Provider | ethers.Signer,
        string,
      ];

      this.accessControl = IAccessControl__factory.connect(
        contractAddress,
        contractRunner,
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
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.accessControl.grantRole(role, account);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async revokeRole(
      role: string,
      account: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.accessControl.revokeRole(role, account);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }

    async renounceRole(
      role: string,
      callerConfirmation: string,
    ): Promise<ethers.ContractTransactionReceipt> {
      return this.withSigner(async () => {
        const tx: ethers.ContractTransactionResponse =
          await this.accessControl.renounceRole(role, callerConfirmation);

        return (await tx.wait()) as ethers.ContractTransactionReceipt;
      });
    }
  };
}

export { AccessControlMixin };

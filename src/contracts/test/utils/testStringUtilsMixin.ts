/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import { Signer } from "ethers";

import { TestStringUtils } from "../../../types/contracts/test/utils/TestStringUtils";
import { TestStringUtils__factory } from "../../../types/factories/contracts/test/utils/TestStringUtils__factory";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-explicit-any
function TestStringUtilsMixin<T extends new (...args: any[]) => {}>(Base: T) {
  return class extends Base {
    private testStringUtils: TestStringUtils;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      const [signer, contractAddress] = args as [Signer, string];
      this.testStringUtils = TestStringUtils__factory.connect(
        contractAddress,
        signer,
      );
    }

    async testBytes32ToString(bytes32Value: string): Promise<string> {
      return await this.testStringUtils.testBytes32ToString(bytes32Value);
    }
  };
}

export { TestStringUtilsMixin };

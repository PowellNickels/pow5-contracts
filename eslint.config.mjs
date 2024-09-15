/*
 * Copyright (C) 2024 Powell Nickels
 * https://github.com/PowellNickels/pow5-contracts
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See the file LICENSE.txt for more information.
 */

import typescriptPlugin from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import simpleImportSort from "eslint-plugin-simple-import-sort";

/** @type {import('eslint').FlatConfig[]} */
const config = [
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      parser: typescriptParser,
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      ...typescriptPlugin.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.mjs", "**/*.ts", "**/*.tsx"],
  },
  {
    ignores: [
      "node_modules/**", // Generated by pnpm
      "tools/**", // Depends build system
      "src/types/**", // Generated by Hardhat
      "dist/**", // Generated by TypeScript
    ],
  },
];

export default config;
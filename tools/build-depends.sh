#!/bin/bash
################################################################################
#
#  Copyright (C) 2024 Powell Nickels
#  https://github.com/PowellNickels/pow5-contracts
#
#  This file is derived from the Ultrachess project under the Apache 2.0 license.
#  Copyright (C) 2022-2023 Ultrachess team
#
#  SPDX-License-Identifier: GPL-3.0-or-later
#  See the file LICENSE.txt for more information.
#
################################################################################

#
# Build script for dependencies
#

# Enable strict mode
set -o errexit
set -o pipefail
set -o nounset

#
# Environment paths
#

# Get the absolute path to this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Directory of the dependency build definitions
DEPENDS_DIR="${SCRIPT_DIR}/depends"

# Directory of the downloaded repos
REPO_DIR="${SCRIPT_DIR}/repos"

# Root project directory
ROOT_DIR="${SCRIPT_DIR}/.."

# Contract directory
CONTRACT_DIR="${ROOT_DIR}/contracts"

# Depends install directory
INSTALL_DIR="${CONTRACT_DIR}/depends"

# Contract interface directory
INTERFACE_DIR="${CONTRACT_DIR}/interfaces"

# Ensure directories exist
mkdir -p "${REPO_DIR}"
mkdir -p "${INSTALL_DIR}"
mkdir -p "${INTERFACE_DIR}"

#
# Import dependencies
#

source "${DEPENDS_DIR}/canonical-weth/package.sh"

#
# Checkout dependencies
#

checkout_canonical_weth

#
# Patch dependencies
#

patch_canonical_weth

#
# Build dependencies
#

build_canonical_weth

#
# Install dependencies
#

install_canonical_weth

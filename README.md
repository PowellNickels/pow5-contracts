# Powell Nickels Smart Contracts

Powell Nickels is a yield farming game that simulates macroeconomics, DeFi and NFT lending. Players deploy digital assets to maximize returns through lending, staking and trading in a way that educates on crypto-economic principles in a risk-managed environment.

## Prerequisites

#### Install pnpm

This project uses pnpm as the package manager for its speed and feature completion. Install pnpm with the following command:

```bash
npm install -g pnpm
```

#### Install Slither

If you want to run the static analysis suite, install Slither with the following command:

```bash
python3 -m pip install slither-analyzer
```

## Package Commands

#### Install dependencies

```bash
pnpm install
```

#### Check for vulnerable packages

```bash
pnpm audit-ci
```

#### Run static analysis suite

```bash
pnpm lint
```

#### Run formatter suite

```bash
pnpm format
```

#### Build smart contract dependencies

```bash
pnpm depends
```

#### Compile smart contracts and typescript sources

```bash
pnpm build
```

#### Run tests

```bash
pnpm test
```

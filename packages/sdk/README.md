# Sodax SDK

The Sodax SDK provides a comprehensive interface for interacting with the Sodax protocol, enabling cross-chain swaps, money market, cross-chain bridging, migration and staking SODA token.

## Table of Contents

### Features

- [Swaps (Solver / Intents)](./docs/SWAPS.md) - Cross-chain intent-based swaps
  - EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, Lightlink) ✅
  - Sui ✅
  - Stellar ✅
  - ICON ✅
  - Solana ✅
  - Injective ✅
- [Money Market](./docs/MONEY_MARKET.md) - Cross-chain lending and borrowing
  - EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, Lightlink) ✅
  - Sui ✅
  - Stellar ✅
  - ICON ✅
  - Solana ✅
  - Injective ✅
- [Bridge](./docs/BRIDGE.md) - Cross-chain token bridging
  - EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, Lightlink) ✅
  - Sui ✅
  - Stellar ✅
  - ICON ✅
  - Solana ✅
  - Injective ✅
- [Migration](./docs/MIGRATION.md) - Token migration (ICX, bnUSD, BALN)
- [Staking](./docs/STAKING.md) - SODA token staking
  - EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, Lightlink) ✅
  - Sui ✅
  - Stellar ✅
  - ICON ✅
  - Solana ✅
  - Injective ✅

### API Endpoints

- [Intent Solver API Endpoints](./docs/SOLVER_API_ENDPOINTS.md) - Solver API endpoint documentation
- [Relayer API Endpoints](./docs/RELAYER_API_ENDPOINTS.md) - Relayer API endpoint documentation

### Guides

- [Configure SDK](./docs/CONFIGURE_SDK.md) - Comprehensive guide for configuring the SDK
- [Monetize SDK](./docs/MONETIZE_SDK.md) - Configure fees and monetize your SDK integration
- [Make a Swap](./docs/HOW_TO_MAKE_A_SWAP.md) - Step by step guide on how to make a swap
- [Create a Spoke Provider](./docs/HOW_TO_CREATE_A_SPOKE_PROVIDER.md) - Comprehensive guide for creating spoke providers
- [Estimate Gas for Raw Transactions](./docs/ESTIMATE_GAS.md) - Estimate transaction gas for raw transaction payloads.
- [Wallet Providers](./docs/WALLET_PROVIDERS.md) - Wallet provider interfaces and implementation guide
- [Stellar Trustline Requirements](./docs/STELLAR_TRUSTLINE.md) - Guide for handling Stellar trustlines across all operations

### Miscellaneous

- [Intent Relay API](./docs/INTENT_RELAY_API.md) - Intent relay API internally used to relay cross-chain messages.
- [Backend API](./docs/BACKEND_API.md) - Sodax Backend API offering access to Intent, Swap, and Money Market data.

## Development

### Installation

```bash
# Using npm
npm install @sodax/sdk

# Using yarn
yarn add @sodax/sdk

# Using pnpm
pnpm add @sodax/sdk
```

### Local Installation

Package can be locally installed by following this steps:

1. Clone this repository to your local machine.
2. `cd` into repository folder location.
3. Execute `pnpm install` command in your CLI to install dependencies.
4. Execute `pnpm run build` to build the packages.
5. In your app repository `package.json` file, define dependency named `"@sodax/sdk"` under `"dependencies"`.
   Instead of version define absolute path to your SDK repository `"file:<sdk-repository-path>"` (e.g. `"file:/Users/dev/.../operation-liquidity-layer/packages/sdk"`).
   Full example: `"@sodax/sdk": "file:/Users/dev/operation-liquidity-layer/sdk-new/packages/sdk"`.

### Local Development

How to setup local development

1. Clone repository.
2. Make sure you have [Node.js](https://nodejs.org/en/download/package-manager) v18+ and corresponding npm installed on your system.
3. Execute `pnpm install` command (from root of the project) in your CLI to install dependencies.
4. Make code changes.
   1. Do not forget to export TS files in same folder `index.ts`.
   2. Always import files using `.js` postfix.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Run in development mode
pnpm dev

# Run type checking
pnpm checkTs

# Format code
pnpm pretty

# Lint code
pnpm lint
```

## License

[MIT](LICENSE)

## Support

- [GitHub Issues](https://github.com/icon-project/sodax-frontend/issues)
- [Discord Community](https://discord.gg/xM2Nh4S6vN)

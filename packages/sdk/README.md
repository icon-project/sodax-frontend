# @sodax/sdk

## Get started

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
5. In your app repository `package.json` file, define dependency named `"@sodax/sdk"` under `"dependencies"`. Instead of version define absolute path to your SDK repository `"file:<sdk-repository-path>"` (e.g. `"file:/Users/dev/.../operation-liquidity-layer/packages/sdk"`). Full example: `"@sodax/sdk": "file:/Users/dev/operation-liquidity-layer/sdk-new/packages/sdk"`.

### Local Development

How to setup local development

1. Clone repository.
2. Make sure you have [Node.js](https://nodejs.org/en/download/package-manager) v18+ and corresponding npm installed on your system.
3. Execute `pnpm install` command (from root of the project) in your CLI to install dependencies.
4. Make code changes.
   1. Do not forget to export TS files in same folder `index.ts`.
   2. Always import files using `.js` postfix.

### Functional Modules inside the SDK

<a href="https://docs.sodax.com/developers/packages/sdk/swaps" class="button secondary" data-icon="rotate">Swaps (Solver)</a> -  Cross-chain intent-based swaps

* EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, Lightlink) ✅
* Sui ✅
* Stellar ✅
* ICON ✅
* Solana ✅
* Injective ✅

<a href="https://docs.sodax.com/developers/packages/sdk/money_market" class="button secondary" data-icon="sack-dollar">Lend / Borrow (Money Market)</a>- Cross-chain lending and borrowing

* EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, Lightlink) ✅
* Sui ✅
* Stellar ✅
* ICON ✅
* Solana ✅
* Injective ✅

<a href="https://docs.sodax.com/developers/packages/sdk/bridge" class="button secondary" data-icon="bridge-suspension">Bridge</a>- Cross-chain token bridging

* EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, Lightlink) ✅
* Sui ✅
* Stellar ✅
* ICON ✅
* Solana ✅
* Injective ✅

<a href="https://docs.sodax.com/developers/packages/sdk/migration" class="button secondary" data-icon="truck">Migration</a>- Token migration (ICX, bnUSD, BALN)

<a href="https://docs.sodax.com/developers/packages/sdk/staking" class="button secondary" data-icon="seedling">Staking</a>- SODA token staking

* EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, Lightlink) ✅
* Sui ✅
* Stellar ✅
* ICON ✅
* Solana ✅
* Injective ✅

### Tooling Modules inside the SDK

<a href="https://docs.sodax.com/developers/packages/sdk/backend_api" class="button secondary" data-icon="plug">Backend API</a>- Solver API endpoint documentation

<a href="https://docs.sodax.com/developers/packages/sdk/intent_relay_api" class="button secondary" data-icon="envelope">Intent Relay API</a>- Relayer API endpoint documentation

***

## Contributing

We welcome contributions! Please see our [Contributing Guide](https://github.com/icon-project/sodax-document/blob/main/developers/packages/sdk/CONTRIBUTING.md) for details.

***

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

***

## License

* [MIT](https://github.com/icon-project/sodax-document/blob/main/developers/packages/sdk/LICENSE/README.md)

***

## Support

* [GitHub Issues](https://github.com/icon-project/sodax-frontend/issues)
* [Discord Community](https://discord.gg/xM2Nh4S6vN)

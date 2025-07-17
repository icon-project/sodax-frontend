# Sodax SDK

The Sodax SDK provides a comprehensive interface for interacting with the Sodax protocol, enabling cross-chain swaps and money market operations.

## Features

### Swaps (Solver / Intents)
  - EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic) ✅
  - Sui ✅
  - Stellar ✅
  - ICON ✅
  - Solana ✅
  - Injective ✅
  - Havah ❌ Coming soon

### Lend and Borrow (Money Market)
  - EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic) ✅
  - Sui ✅
  - Stellar ✅
  - ICON ✅
  - Solana ✅
  - Injective ✅
  - Havah ❌ Coming soon


## Installation
 
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

## Local Development

How to setup local development

1. Clone repository.
2. Make sure you have [Node.js](https://nodejs.org/en/download/package-manager) v18+ and corresponding npm installed on your system.
3. Execute `pnpm install` command (from root of the project) in your CLI to install dependencies.
4. Make code changes.
   1. Do not forget to export TS files in same folder `index.ts`.
   2. Always import files using `.js` postfix.

## Intent Solver Endpoints

Current Intent Solver API endpoints:
- **Production (mainnet)**: "https://sodax-solver.iconblockchain.xyz"
- **Staging** (mainnet): "https://sodax-solver-staging.iconblockchain.xyz"

**Note** Staging endpoint contains features to be potentially released and is subject to frequent change!

## Relayer API Endpoints

Current Relayer API endpoints:
- **Production (mainnet)**: "https://xcall-relay.nw.iconblockchain.xyz"
- **Staging** (mainnet): "https://testnet-xcall-relay.nw.iconblockchain.xyz"

**Note** Staging endpoint contains features to be potentially released and is subject to frequent change!

## Usage

The Sodax SDK is initialized by creating a new `Sodax` instance with your desired configuration. The SDK supports both Solver (for intent-based swaps) and Money Market (for cross-chain lending and borrowing) services.

Both Solver and Money Market configuration and optional. You can always choose to use just a specific feature.

### Basic Configuration

```typescript
// Initialize Sodax using default Sonic mainnet configurations (no fees)
const sodax = new Sodax();

// Use default config but put fee on solver (intent swaps)
const sodaxWithSolverFees = new Sodax({
  solver: { partnerFee: partnerFeePercentage },
});

// Use default config with fee on money market (borrows)
const sodaxWithMoneyMarketFees = new Sodax({
  moneyMarket: { partnerFee: partnerFeePercentage },
});

// or use default config with fees on both solver and money market
const sodaxWithFees = new Sodax({
  solver: { partnerFee: partnerFeePercentage },
  moneyMarket: { partnerFee: partnerFeePercentage },
});
```

### Custom Configuration

Sodax SDK can be customized for partner fee, solver or money market configuration.

```typescript
import {
  Sodax,
  PartnerFee,
  SolverConfigParams,
  getSolverConfig,
  getMoneyMarketConfig,
} from '@sodax/sdk';

// Partner fee can be defined as a percentage or a definite token amount.
// Fee is optional, you can leave it empty/undefined.
const partnerFeePercentage = {
  address: '0x0000000000000000000000000000000000000000', // address to receive fee too
  percentage: 100, // 100 = 1%, 10000 = 100%
} satisfies PartnerFee;

const partnerFeeAmount = {
  address: '0x0000000000000000000000000000000000000000', // address to receive fee too
  amount: 1000n, // definite amount denominated in token decimal precision
} satisfies PartnerFee;

// Solver config is optional and is required only if you want to use intent based swaps.
// You can either use custom solver config or the default one (based on hub chain id - defaults to Sonic chain as hub)

// example of custom solver config
const customSolverConfig = {
  intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
  solverApiEndpoint: 'https://sodax-solver.iconblockchain.xyz',
  partnerFee: partnerFeePercentage, // or partnerFeeAmount
} satisfies SolverConfigParams;

// pre-defined default solver config per hub chain id (Sonic hub is the default)
const solverConfig: SolverConfigParams = getSolverConfig(SONIC_MAINNET_CHAIN_ID);

  // example of custom money market config
const customMoneyMarketConfig = {
  lendingPool: '0x553434896D39F867761859D0FE7189d2Af70514E',
  uiPoolDataProvider: '0xC04d746C38f1E51C8b3A3E2730250bbAC2F271bf',
  poolAddressesProvider: '0x036aDe0aBAA4c82445Cb7597f2d6d6130C118c7b',
  bnUSD: '0x94dC79ce9C515ba4AE4D195da8E6AB86c69BFc38',
  bnUSDVault: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131',
} satisfies MoneyMarketConfig;

// pre-defined default money market config per hub chain id (Sonic hub is the default)
const moneyMarketConfig = getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID);

// example of custom hub config
const hubConfig = {
  hubRpcUrl: 'https://rpc.soniclabs.com',
  chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
} satisfies EvmHubProviderConfig;


// Initialize Sodax using custom/default configurations
const sodax = new Sodax({
  solver: solverConfig,
  moneyMarket: moneyMarketConfig,
  hubProviderConfig: hubConfig,
});
```

### Using SDK Config and Constants

SDK includes predefined configurations of supported chains, tokens and other relevant information for the client to consume.

**NOTE** you should generally only use `spokeChains` configuration to retrieve all supported chains and then invoke per spoke chain based configurations. If you are using hub configurations you should know what you are doing.

Please refer to [SDK constants.ts](https://github.com/icon-project/sodax-frontend/blob/main/packages/sdk/src/constants.ts) for more.

```typescript
import {
  getHubChainConfig,
  supportedHubAssets,
  supportedHubChains,
  supportedSpokeChains,
  spokeChainConfig,
  getSupportedSolverTokens,
  moneyMarketReserveAssets,
} from "@sodax/sdk";

const hubChainConfig = getHubChainConfig(SONIC_MAINNET_CHAIN_ID);

// all supported hub chains (Sonic mainnet and testnet)
export const hubChains: HubChainId[] = supportedHubChains;

// all supported spoke chains
export const spokeChains: SpokeChainId[] = supportedSpokeChains;

// all hub assets (original asset addresses mapped to "Abstracted evm addresses")
export const hubAssets: Set<Address> = supportedHubAssets;

// all money market reserve addresses on hub chain (sonic)
export const moneyMarketReserves = moneyMarketReserveAssets;

// record mapping spoke chain Id to spoke chain configs
export spokeChainConfigRecord : Record<SpokeChainId, SpokeChainConfig> = spokeChainConfig;

// using spoke chain id to retrieve supported tokens for solver (intent swaps)
const supportedSolverTokens: readonly Token[] = getSupportedSolverTokens(spokeChainId);

// using spoke chain id to retrieve supported tokens address (on spoke chain = original address) for money market
const supportedMoneyMarketTokens: readonly Token[] = getSupportedMoneyMarketTokens(spokeChainId)

// checkout constants.ts for all configs available
```

### Wallet Providers

Sodax SDK does not force the usage of a specific wallet or library, but requires client to provide implementation of `IWalletProvider` interfaces (e.g. for EVM chains `IEvmWalletProvider` has to be implemented).

As part of Sodax suite, xWagmi SDK is also going to be provided as one example wallet provider implementation. You are free to choose between using our xWagmi SDK or implementing your own wallet connectivity for each chain.

- Supported Wallet Provider Interface (`IWalletProvider`)
  - `IEvmWalletProvider`: EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon) ✅
  - `ISuiWalletProvider`: Sui ✅
  - `IIconWalletProvider`: ICON ✅
  - `IStellarWalletProvider`: Stellar ✅
  - Solana ❌ Coming soon
  - Injective ❌ Coming soon
  - Havah ❌ Coming soon

### Initialising Spoke Provider

Spoke provider is a main instance used to interact with Sodax features because it contains all the relevant information we need to successfully execute features. You should generally establish SpokeProvider instances for each chain (e.g. evm, sui, etc..) user connects wallet to.

Spoke is simply a chain you are connecting to and SpokeProvider is a container of relevant wallet provider and chain configuration.

**IMPORTANT**: Sonic Spoke Provider must be instantiated as `SonicSpokeProvider` instance even though it is of `EVM` chain type. This is due to the fact that Sonic chain is a hub chain of Sodax and needs special handling under the hood.

EVM Provider example:

```typescript
import { EvmProvider, EvmHubProvider, EvmSpokeProvider, AVALANCHE_MAINNET_CHAIN_ID, SONIC_MAINNET_CHAIN_ID } from "@sodax/sdk"

const evmWalletProvider: IEvmWalletProvider = // injected by xWagmi SDK or your own implementation

// spoke provider represents connection to a specific chain, should be instantiated for each supported chain when user connects wallet
const bscSpokeProvider: EvmSpokeProvider = new EvmSpokeProvider(
  evmWalletProvider, // user connected wallet
  spokeChainConfig[BSC_MAINNET_CHAIN_ID] as EvmSpokeChainConfig, // connected chain config
);
```

### Accessing Sodax Features

Sodax feature set currently contain:
- Solver: used for intent based swaps. Please find documentation for Solver part of the SDK in [SOLVER.md](./docs/SOLVER.md)
- Money Market: used for lending and borowing. Please find documentation for Solver part of the SDK in [MONEY_MARKET.md](./docs/MONEY_MARKET.md)

## Intent Relay API

Intent relay is internally used to relay transaction information from one chain to another.
Sodax SDK abstracts the heavy lifting of using the relay, but you can find documentation for Intent Relay API in [INTENT_RELAY_API.md](./docs/INTENT_RELAY_API.md) in case you want to explore it.


## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Development

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

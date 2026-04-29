# packages/wallet-sdk-core

Low-level multi-chain wallet providers for signing and broadcasting transactions. Each chain has a provider class supporting both private-key (for scripts/testing) and browser-extension (for production dApps) configurations.

## Architecture

### Folder-per-provider structure

Each provider lives in its own folder under `src/wallet-providers/` with co-located implementation, types, tests, and a barrel `index.ts`:

```
src/
├── index.ts                          # Public re-exports (wallet-providers + types)
├── types/                            # Shared library-level types
├── utils/                            # Internal utils (shallowMerge); not re-exported publicly
└── wallet-providers/
    ├── index.ts                      # Barrel re-export of every provider folder
    ├── BaseWalletProvider.ts         # Abstract base: holds `defaults`, exposes mergePolicy/mergeDefaults
    ├── evm/                          # EVM (12 chains via viem)
    │   ├── EvmWalletProvider.ts
    │   ├── EvmWalletProvider.test.ts
    │   ├── types.ts
    │   └── index.ts
    ├── solana/                       # Solana (@solana/web3.js)
    ├── sui/                          # Sui (@mysten/sui)
    ├── icon/                         # ICON (icon-sdk-js)
    ├── injective/                    # Injective (@injectivelabs/sdk-ts)
    ├── stellar/                      # Stellar (@stellar/stellar-sdk)
    ├── stacks/                       # Stacks (@stacks/transactions)
    ├── bitcoin/                      # Bitcoin (bitcoinjs-lib, PSBT signing)
    └── near/                         # NEAR (near-api-js)
```

### Provider Pattern

Each provider:
1. Extends abstract `BaseWalletProvider<TDefaults>` to inherit `defaults` storage and merge helpers
2. Implements a chain-specific interface extending `WalletAddressProvider` from `@sodax/types`
3. Accepts a discriminated union config: `PrivateKey*Config | BrowserExtension*Config`, plus an optional `defaults` field of `TDefaults` shape
4. Constructor calls `super(walletConfig.defaults)` and picks the implementation path based on config type
5. Exposes: `getWalletAddress()`, chain-specific signing/sending methods

### Configurable defaults

`BaseWalletProvider` lets each provider declare a `TDefaults` shape, then merge per-call options over those defaults:

- `mergePolicy(key, options)` — merge over a slice of defaults keyed by method (e.g. `defaults.sendTransaction`)
- `mergeDefaults(options)` — merge over a flat defaults object

Merging is **shallow** (top-level only) via `utils/shallowMerge`. Nested objects are replaced wholesale, not deep-merged — see JSDoc on `shallowMerge`.

Example interfaces:
- `IEvmWalletProvider`: `sendTransaction()`, `waitForTransactionReceipt()`
- `ISolanaWalletProvider`: `sendTransaction()`, `buildV0Txn()`, `getAssociatedTokenAddress()`
- `IBitcoinWalletProvider`: `signTransaction()`, `signEcdsaMessage()`, `signBip322Message()`

### Dual Config Pattern

Every provider supports two modes:

```typescript
// For scripts, testing, CI
const provider = new EvmWalletProvider({
  type: 'privateKey',
  privateKey: '0x...',
  chainId: SONIC_MAINNET_CHAIN_ID,
  rpcUrl: 'https://...',
});

// For browser dApps (uses injected wallet)
const provider = new EvmWalletProvider({
  type: 'browserExtension',
  walletClient: viemWalletClient,
  publicClient: viemPublicClient,
});
```

### Adding a New Chain Provider

Follow an existing implementation (e.g. `evm/`):
1. Create folder `src/wallet-providers/<chain>/`
2. In `<chain>/types.ts`: define `PrivateKey<Chain>WalletConfig`, `BrowserExtension<Chain>WalletConfig`, the `<Chain>WalletConfig` discriminated union, the `<Chain>Defaults` shape, and the provider interface `I<Chain>WalletProvider` extending `WalletAddressProvider`
3. In `<chain>/<Chain>WalletProvider.ts`: implement the class extending `BaseWalletProvider<<Chain>Defaults>`, calling `super(walletConfig.defaults)` and discriminating on config type
4. Add `<chain>/<Chain>WalletProvider.test.ts` covering constructor variants, defaults merge, and core methods
5. Add `<chain>/index.ts` barrel: `export * from './types.js'; export * from './<Chain>WalletProvider.js';`
6. Re-export the folder from `src/wallet-providers/index.ts`

## Biome Overrides (Tech Debt)

This package has a local `biome.json` that relaxes several root rules:
- `noNonNullAssertion: off`
- `noExplicitAny: off`
- `noStaticOnlyClass: off`

These are tech debt. When modifying code in this package, fix non-null assertions and `any` types where possible rather than relying on these overrides.

## Build

tsup: dual ESM (`.mjs`) + CJS (`.cjs`). Platform: neutral (Node + browser).
`near-api-js` and `@sodax/types` are force-bundled for CJS compatibility via `noExternal` in tsup config.

## Tests

Vitest. Co-located tests (`*.test.ts`) inside each provider folder. All 9 providers have tests covering constructor variants and defaults merge; EVM and Sui have deeper coverage of method behavior. `utils/merge.test.ts` covers `shallowMerge` edge cases.

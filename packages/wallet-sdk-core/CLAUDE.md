# packages/wallet-sdk-core

Low-level multi-chain wallet providers for signing and broadcasting transactions. Each chain has a provider class supporting both private-key (for scripts/testing) and browser-extension (for production dApps) configurations.

## Architecture

### Flat Structure

All providers live in `src/wallet-providers/` — one file per chain, no subdirectories:

```
src/
├── index.ts                       # Re-exports from wallet-providers/
└── wallet-providers/
    ├── index.ts                   # Barrel export
    ├── EvmWalletProvider.ts       # EVM (12 chains via viem)
    ├── SolanaWalletProvider.ts    # Solana (@solana/web3.js)
    ├── SuiWalletProvider.ts       # Sui (@mysten/sui)
    ├── IconWalletProvider.ts      # ICON (icon-sdk-js)
    ├── InjectiveWalletProvider.ts # Injective (@injectivelabs/sdk-ts)
    ├── StellarWalletProvider.ts   # Stellar (@stellar/stellar-sdk)
    ├── StacksWalletProvider.ts    # Stacks (@stacks/transactions)
    ├── BTCWalletProvider.ts       # Bitcoin (bitcoinjs-lib, PSBT signing)
    └── NearWalletProvider.ts      # NEAR (near-api-js)
```

### Provider Pattern

Each provider:
1. Implements a chain-specific interface extending `WalletAddressProvider` from `@sodax/types`
2. Accepts a discriminated union config: `PrivateKey*Config | BrowserExtension*Config`
3. Constructor picks the implementation path based on config type
4. Exposes: `getWalletAddress()`, chain-specific signing/sending methods

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

Follow an existing implementation:
1. Create `<Chain>WalletProvider.ts` in `src/wallet-providers/`
2. Define config types: `PrivateKey<Chain>WalletConfig` and `BrowserExtension<Chain>WalletConfig`
3. Define the provider interface `I<Chain>WalletProvider` extending `WalletAddressProvider`
4. Implement the provider class with constructor-based config discrimination
5. Export from `src/wallet-providers/index.ts`

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

Vitest. Co-located tests (`*.test.ts`). Currently only EVM and ICON providers have tests — coverage should be expanded.

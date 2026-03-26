# packages/types

Shared TypeScript type definitions for the SODAX monorepo. This package is the single source of truth for chain configurations, wallet provider interfaces, and backend API types.

**Note:** This package is planned to be absorbed into `packages/sdk`. When working here, keep types organized in a way that facilitates this migration.

## Structure

```
src/
├── index.ts          # Barrel export (re-exports all subdirectories)
├── common/           # Core shared types: Chain, Token, Address, RPC configs, SpokeChainConfig, WalletAddressProvider
├── constants/        # Chain IDs, chain configs, hub assets, spoke chain configs for all 20 chains (~52k lines)
├── backend/          # API request/response types, IConfigApi interface, swap flow types
├── evm/              # IEvmWalletProvider, EVM transaction types
├── solana/           # ISolanaWalletProvider, Solana transaction types
├── stellar/          # IStellarWalletProvider, Stellar transaction types
├── sui/              # ISuiWalletProvider, Sui transaction types
├── icon/             # IIconWalletProvider, ICON transaction types
├── injective/        # IInjectiveWalletProvider, Injective transaction types
├── near/             # INearWalletProvider, NEAR transaction types
├── stacks/           # IStacksWalletProvider, Stacks transaction types
└── btc/              # IBitcoinWalletProvider, Bitcoin transaction types (UTXO, PSBT)
```

## Key Type Categories

### Chain Abstractions (`common/`)
- `Chain`, `ChainId`, `ChainType`, `HubChainId`, `SpokeChainId`
- `Token`, `XToken`, `HubAsset`
- `Address`, `Hex`, `Hash`
- `BaseSpokeChainConfig<T>` — generic config with chain-specific specializations
- `WalletAddressProvider` — base interface all wallet providers extend

### Constants (`constants/`)
- 20 chain ID constants
- `CHAIN_IDS`, `EVM_CHAIN_IDS`, `HUB_CHAIN_IDS` groupings
- `baseChainInfo` — chain ID to name/type mapping
- `spokeChainConfig` — full configuration per chain (addresses, tokens, RPC URLs)
- Hub vault symbols (23 vault tokens)
- `CONFIG_VERSION` — incremented when config structure changes

### Wallet Provider Interfaces (per-chain directories)
Each chain directory defines `I<Chain>WalletProvider` extending `WalletAddressProvider`:
- Chain-specific methods (signing, sending, balance queries)
- Raw transaction types for that chain
- These interfaces are implemented by `wallet-sdk-core` providers

## Build

Built with `tsc` (not tsup). Output: `dist/` with `.js` + `.d.ts` files. ESM only.

## Important Notes

- `constants/index.ts` is ~52k lines — it contains all chain configurations inline. When modifying, be precise about which chain config you're changing.
- All numeric fields in API types use `string` (not `bigint`) to avoid JSON serialization issues.
- The `WalletAddressProvider` base interface is the contract between this package and `wallet-sdk-core`.

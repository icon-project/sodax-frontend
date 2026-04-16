# packages/wallet-types

Pure TypeScript wallet provider interfaces and chain-specific transaction types for the SODAX ecosystem. This is the contract layer between `wallet-sdk-core` (implementations) and consumers (SDK, dapp-kit).

## Structure

```
src/
├── index.ts       # Barrel export (re-exports common, stacks, stellar, sui, injective, bitcoin)
├── common.ts      # Base types: Hex, Hash, Address, WalletAddressProvider
├── evm.ts         # IEvmWalletProvider, EvmRawTransaction, EvmRawTransactionReceipt
├── bitcoin.ts     # IBitcoinWalletProvider, UTXO
├── solana.ts      # ISolanaWalletProvider, Solana transaction/instruction types
├── stellar.ts     # IStellarWalletProvider, StellarRawTransactionReceipt
├── sui.ts         # ISuiWalletProvider, SuiTransaction, SuiCoinStruct
├── icon.ts        # IIconWalletProvider, IcxCallTransaction, IconTransactionResult
├── injective.ts   # IInjectiveWalletProvider, InjectiveExecuteResult
├── near.ts        # INearWalletProvider, CallContractParams, NearRawTransaction
└── stacks.ts      # IStacksWalletProvider, ClarityValue, PostCondition types
```

Flat file layout — one file per chain, no subdirectories.

## Root vs Sub-package Exports

The root `index.ts` re-exports: `common`, `stacks`, `stellar`, `sui`, `injective`, `bitcoin`.

**Not in root exports:** `evm`, `icon`, `solana`, `near` — these must be imported via sub-package paths (e.g. `@sodax/wallet-types/evm`).

## Build

Built with `tsc` (not tsup). Output: `dist/` with `.js` + `.d.ts` files. ESM only (`"type": "module"`).

## Rules

- **No external dependencies.** This package has zero `dependencies` and must stay that way. Only `typescript` exists as a devDependency. Never add runtime dependencies — all types must be self-contained.
- **No re-exporting external types.** Do not import or re-export types from third-party packages (e.g. `viem`, `ethers`, `@solana/web3.js`). Define equivalent types locally.
- **All wallet provider interfaces must extend `WalletAddressProvider`** from `common.ts`.
- **Use `import type` for all imports** — this package should produce no runtime JavaScript beyond empty re-exports.
- **Flat file structure.** One file per chain. Do not introduce subdirectories.
- **No `bigint` in types** that may be serialized. Use `string` for numeric fields.
- **No `any` types.** Use `unknown` where the type cannot be determined.
- **No runtime logic.** This package defines types and interfaces only. Enums in `stacks.ts` are the sole exception (they produce runtime values by nature).
- **Sub-package exports must stay in sync with `package.json` `exports` field.** When adding a new chain file, add a corresponding entry in `exports`.

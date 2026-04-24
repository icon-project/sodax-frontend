# @sodax/wallet-types

Wallet connectivity type definitions for the SODAX multi-chain ecosystem.

Provides `WalletProvider` interfaces and chain-specific transaction types for 9 blockchain families. Self-contained with **zero external dependencies**.

## Install

```bash
pnpm add @sodax/wallet-types
```

## Usage

Import everything from the root:

```typescript
import type { WalletAddressProvider, IBitcoinWalletProvider } from '@sodax/wallet-types';
```

Or import only the chain you need via sub-package exports:

```typescript
import type { IEvmWalletProvider, EvmRawTransaction } from '@sodax/wallet-types/evm';
import type { ISolanaWalletProvider } from '@sodax/wallet-types/solana';
import type { IBitcoinWalletProvider, UTXO } from '@sodax/wallet-types/bitcoin';
import type { IIconWalletProvider } from '@sodax/wallet-types/icon';
import type { INearWalletProvider } from '@sodax/wallet-types/near';
import type { IStellarWalletProvider } from '@sodax/wallet-types/stellar';
import type { ISuiWalletProvider } from '@sodax/wallet-types/sui';
import type { IInjectiveWalletProvider } from '@sodax/wallet-types/injective';
import type { IStacksWalletProvider } from '@sodax/wallet-types/stacks';
```

## Supported Chains

| Chain | Sub-import | Wallet Provider Interface |
| --- | --- | --- |
| EVM (Sonic, Ethereum, Arbitrum, …) | `@sodax/wallet-types/evm` | `IEvmWalletProvider` |
| Bitcoin | `@sodax/wallet-types/bitcoin` | `IBitcoinWalletProvider` |
| Solana | `@sodax/wallet-types/solana` | `ISolanaWalletProvider` |
| Stellar | `@sodax/wallet-types/stellar` | `IStellarWalletProvider` |
| Sui | `@sodax/wallet-types/sui` | `ISuiWalletProvider` |
| ICON | `@sodax/wallet-types/icon` | `IIconWalletProvider` |
| Injective | `@sodax/wallet-types/injective` | `IInjectiveWalletProvider` |
| NEAR | `@sodax/wallet-types/near` | `INearWalletProvider` |
| Stacks | `@sodax/wallet-types/stacks` | `IStacksWalletProvider` |

## Base Interface

All wallet providers extend `WalletAddressProvider`:

```typescript
interface WalletAddressProvider {
  getWalletAddress(): Promise<string>;
  getPublicKey?: () => Promise<string>;
}
```

Each chain-specific provider adds its own signing, transaction, and query methods.

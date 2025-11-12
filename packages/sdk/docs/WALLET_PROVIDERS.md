# Wallet Providers

Sodax SDK does not force the usage of a specific wallet or library, but requires client to provide implementation of `IWalletProvider` interfaces (e.g. for EVM chains `IEvmWalletProvider` has to be implemented).

As part of Sodax suite, Wallet SDK is also going to be provided as one example wallet provider implementation. You are free to choose between using our Wallet SDK or implementing your own wallet connectivity for each chain.

## Supported Wallet Provider Interfaces

The SDK supports the following wallet provider interfaces (`IWalletProvider`):

- `IEvmWalletProvider`: EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, Lightlink) ✅
- `ISuiWalletProvider`: Sui ✅
- `IIconWalletProvider`: ICON ✅
- `IStellarWalletProvider`: Stellar ✅
- `ISolanaWalletProvider`: Solana ✅
- `IInjectiveWalletProvider`: Injective ✅

## Implementation Package

For ready-to-use wallet provider implementations, you can install the [`@sodax/wallet-sdk-core`](https://www.npmjs.com/package/@sodax/wallet-sdk-core) package:

```bash
# Using npm
npm install @sodax/wallet-sdk-core

# Using yarn
yarn add @sodax/wallet-sdk-core

# Using pnpm
pnpm add @sodax/wallet-sdk-core
```

The `@sodax/wallet-sdk-core` package provides TypeScript implementations of wallet providers for all supported blockchain networks, making them compatible with the Core Sodax SDK (`@sodax/sdk`). It includes:

- **Multi-chain Support**: Wallet provider implementations for multiple blockchain networks
- **TypeScript Compatibility**: Fully typed implementations compatible with `@sodax/sdk`
- **Wallet Provider Interface**: Standardized interface for wallet connectivity across different chains
- **Core Integration**: Seamless integration with the Core Sodax SDK

For more information, see the [@sodax/wallet-sdk-core README](../../wallet-sdk-core/README.md).

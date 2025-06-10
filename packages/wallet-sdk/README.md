# @sodax/wallet-sdk

A comprehensive wallet SDK for the Sodax ecosystem that provides unified wallet connectivity across multiple blockchain networks.

## Features

- 🔗 Multi-chain Support
  - EVM (Ethereum, BSC, Polygon, etc.)
  - Solana
  - Sui
  - Stellar
  - Injective
  - Havah
  - ICON (Hana Wallet)

- 🔒 Wallet Integration
  - MetaMask
  - Hana Wallet
  - Phantom
  - Sui Wallet
  - Keplr
  - Havah Wallet
  - Stellar Wallets

- 🛠️ Core Features
  - Unified wallet connection interface
  - Cross-chain transaction support
  - Type-safe development with TypeScript
  - React hooks for easy integration
  - State management with Zustand

## Installation

```bash
# Using npm
npm install @sodax/wallet-sdk

# Using yarn
yarn add @sodax/wallet-sdk

# Using pnpm
pnpm add @sodax/wallet-sdk
```

## Peer Dependencies

This package requires the following peer dependencies:

```json
{
  "react": ">=19",
  "@tanstack/react-query": "latest"
}
```

## Quick Start

```typescript
import { useWallet } from '@sodax/wallet-sdk';

function WalletConnect() {
  const { connect, disconnect, address, isConnected } = useWallet();

  return (
    <div>
      {!isConnected ? (
        <button onClick={connect}>Connect Wallet</button>
      ) : (
        <button onClick={disconnect}>Disconnect</button>
      )}
    </div>
  );
}
```

## Supported Networks

The SDK supports multiple blockchain networks through dedicated services:

- `EvmXService`: EVM-compatible chains
- `SolanaXService`: Solana network
- `SuiXService`: Sui network
- `StellarXService`: Stellar network
- `InjectiveXService`: Injective network
- `HavahXService`: Havah network

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

## Requirements

- Node.js >= 18.0.0
- React >= 19
- TypeScript

## License

MIT

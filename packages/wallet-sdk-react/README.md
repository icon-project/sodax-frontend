# @sodax/wallet-sdk-react

A comprehensive React Wallet SDK tailored for the Sodax ecosystem that provides unified wallet connectivity across multiple blockchain networks.

## Features
- Seamless wallet connectivity for all supported wallets in the Sodax network
  - EVM Wallets: All browser extensions that support [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) (Hana Wallet, MetaMask, Phantom, etc.) ✅
  - Sui Wallets: All browser extension that @mysten/dapp-kit supports (Hana, Sui Wallet, Suiet, etc.) ✅
  - Solana Wallets: ✅
  - Stellar Wallets: ✅
  - Injective Wallets: ✅
  - ICON Wallets: ✅ (Hana Wallet and other ICON-compatible extensions)

- Address and connection state management
  - EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon, Sonic, HyperEVM, LightLink) ✅
  - Sui ✅
  - Solana ✅
  - Stellar ✅
  - Injective ✅
  - ICON ✅


## Installation

```bash
# Using npm
npm install @sodax/wallet-sdk-react

# Using yarn
yarn add @sodax/wallet-sdk-react

# Using pnpm
pnpm add @sodax/wallet-sdk-react
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
import { SodaxWalletProvider, useXConnectors, useXConnect, useXAccount } from '@sodax/wallet-sdk-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { RpcConfig } from '@sodax/types';

// Create a QueryClient instance
const queryClient = new QueryClient();

const rpcConfig: RpcConfig = {
  // EVM chains
  sonic: 'https://rpc.soniclabs.com',
  '0xa86a.avax': 'https://api.avax.network/ext/bc/C/rpc',
  '0xa4b1.arbitrum': 'https://arb1.arbitrum.io/rpc',
  '0x2105.base': 'https://mainnet.base.org',
  '0x38.bsc': 'https://bsc-dataseed1.binance.org',
  '0xa.optimism': 'https://mainnet.optimism.io',
  '0x89.polygon': 'https://polygon-rpc.com',
  
  // Other chains
  '0x1.icon': 'https://ctz.solidwallet.io/api/v3',
  solana: 'https://solana-mainnet.g.alchemy.com/v2/your-api-key',
  sui: 'https://fullnode.mainnet.sui.io',
  'injective-1': 'https://sentry.tm.injective.network:26657',
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SodaxWalletProvider rpcConfig={rpcConfig}>
        <WalletConnect />
      </SodaxWalletProvider>
    </QueryClientProvider>
  );
}

function WalletConnect() {
  // Get available connectors for EVM chain
  const connectors = useXConnectors('EVM');
  
  // Get connect mutation
  const { mutateAsync: connect } = useXConnect();

  // Get connected account info
  const account = useXAccount('EVM');

  return (
    <div className="space-y-4">
      {/* Display connected wallet address if connected */}
      {account?.address && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <p className="text-sm text-gray-600">Connected Wallet:</p>
          <p className="font-mono">{account.address}</p>
        </div>
      )}

      {/* Display available connectors */}
      <div className="space-y-2">
        {connectors.map((connector) => (
          <button
            key={connector.id}
            onClick={() => connect(connector)}
            className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50"
          >
            <img 
              src={connector.icon} 
              alt={connector.name} 
              width={24} 
              height={24} 
              className="rounded-md" 
            />
            <span>Connect {connector.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

This example demonstrates:
1. Setting up the required providers (`QueryClientProvider` and `SodaxWalletProvider`)
2. Using `useXConnectors` to get available wallet connectors
3. Using `useXConnect` to handle wallet connections
4. Using `useXAccount` to display the connected wallet address
5. A basic UI to display and connect to available wallets


## Requirements

- Node.js >= 18.0.0
- React >= 19
- TypeScript


## API Reference

### Components

- [`SodaxWalletProvider`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/SodaxWalletProvider.tsx) - Main provider component for wallet connectivity

### Hooks

#### Core Wallet Hooks
- [`useXConnectors`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/hooks/useXConnectors.ts) - Get available wallet connectors
- [`useXConnect`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/hooks/useXConnect.ts) - Connect to a wallet
- [`useXAccount`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/hooks/useXAccount.ts) - Get account information
- [`useXDisconnect`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/hooks/useXDisconnect.ts) - Disconnect from a wallet

#### Chain-Specific Hooks
- [`useEvmSwitchChain`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/hooks/evm/useEvmSwitchChain.ts) - Switch between EVM chains

#### Balance Hooks
- [`useXBalances`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/hooks/useXBalances.ts) - Fetch token balances

#### Service Hooks
- [`useXService`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/hooks/useXService.ts) - Access chain-specific service

### Types

#### Core Types
- [`XAccount`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/types/index.ts) - Wallet account type
- [`XConnection`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/types/index.ts) - Wallet connection type
- [`XConnector`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/types/index.ts) - Wallet connector type
- [`XToken`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/types/index.ts) - Cross-chain token type

### Classes

#### XConnector
- [`XConnector`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/core/XConnector.ts) - Base class for wallet connectors
- [`EvmXConnector`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/xchains/evm/EvmXConnector.ts) - EVM wallet connector
- [`SolanaXConnector`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/xchains/solana/SolanaXConnector.ts) - Solana wallet connector
- [`SuiXConnector`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/xchains/sui/SuiXConnector.ts) - Sui wallet connector
- [`StellarXConnector`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/xchains/stellar/StellarWalletsKitXConnector.ts) - Stellar wallet connector
- [`InjectiveMetamaskXConnector`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/xchains/injective/InjectiveMetamaskXConnector.ts) - Injective MetaMask connector
- [`InjectiveKelprXConnector`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/xchains/injective/InjectiveKelprXConnector.ts) - Injective Keplr connector
- [`IconXConnector`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/xchains/icon/IconHanaXConnector.ts) - ICON wallet connector

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
- [Discord Community](https://discord.gg/sodax-formerly-icon-880651922682560582)

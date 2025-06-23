# @sodax/wallet-sdk

A comprehensive wallet SDK for the Sodax ecosystem that provides unified wallet connectivity across multiple blockchain networks.

## Features
- Seamless wallet connectivity for all supported wallets in the Sodax network
  - EVM Wallets: All browser extensions that support [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) (Hana Wallet, MetaMask, Phantom, etc.) ✅
  - Sui Wallets: All browser extension that @mysten/dapp-kit supports (Hana, Sui Wallet, Suiet, etc.) ✅
  - Solana Wallets: ❌ Coming soon
  - Stellar Wallets: ❌ Coming soon
  - Injective Wallets: ❌ Coming soon
  - Havah Wallets: ❌ Coming soon
  - ICON Wallets: ✅ (Hana Wallet and other ICON-compatible extensions)

- Address and connection state management
  - EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon) ✅
  - Sui ✅
  - Solana ❌ Coming soon
  - Stellar ❌ Coming soon
  - Injective ❌ Coming soon
  - Havah ❌ Coming soon
  - ICON ✅


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
import { XWagmiProviders, useXConnectors, useXConnect, useXAccount } from '@sodax/wallet-sdk';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a QueryClient instance
const queryClient = new QueryClient();

// Your wagmi configuration
const wagmiConfig = {
  // ... your wagmi config
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <XWagmiProviders
        config={{
          EVM: {
            wagmiConfig: wagmiConfig,
          },
          SUI: {
            isMainnet: true,
          },
          SOLANA: {
            endpoint: 'https://your-rpc-endpoint',
          },
          ICON: {}
        }}
      >
        <WalletConnect />
      </XWagmiProviders>
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
1. Setting up the required providers (`QueryClientProvider` and `XWagmiProviders`)
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

- [`XWagmiProviders`](./src/providers/XWagmiProviders.tsx) - Main provider component for wallet connectivity

### Hooks

#### Core Wallet Hooks
- [`useXConnectors`](./src/hooks/useXConnectors.ts) - Get available wallet connectors
- [`useXConnect`](./src/hooks/useXConnect.ts) - Connect to a wallet
- [`useXAccount`](./src/hooks/useXAccount.ts) - Get account information
- [`useXDisconnect`](./src/hooks/useXDisconnect.ts) - Disconnect from a wallet

#### Chain-Specific Hooks
- [`useEvmSwitchChain`](./src/hooks/evm/useEvmSwitchChain.ts) - Switch between EVM chains

#### Balance Hooks
- [`useXBalances`](./src/hooks/useXBalances.ts) - Fetch token balances

#### Service Hooks
- [`useXService`](./src/hooks/useXService.ts) - Access chain-specific service

### Types

#### Core Types
- [`XAccount`](./src/types/index.ts) - Wallet account type
- [`XConnection`](./src/types/index.ts) - Wallet connection type
- [`XConnector`](./src/types/index.ts) - Wallet connector type
- [`XToken`](./src/types/index.ts) - Cross-chain token type

### Classes

#### XConnector
- [`XConnector`](./src/core/XConnector.ts) - Base class for wallet connectors
- [`EvmXConnector`](./src/xchains/evm/EvmXConnector.ts) - EVM wallet connector
- [`SolanaXConnector`](./src/xchains/solana/SolanaXConnector.ts) - Solana wallet connector
- [`SuiXConnector`](./src/xchains/sui/SuiXConnector.ts) - Sui wallet connector
- [`StellarXConnector`](./src/xchains/stellar/StellarWalletsKitXConnector.ts) - Stellar wallet connector
- [`InjectiveMetamaskXConnector`](./src/xchains/injective/InjectiveMetamaskXConnector.ts) - Injective MetaMask connector
- [`InjectiveKelprXConnector`](./src/xchains/injective/InjectiveKelprXConnector.ts) - Injective Keplr connector
- [`HavahXConnector`](./src/xchains/havah/HavahXConnector.ts) - Havah wallet connector
- [`IconXConnector`](./src/xchains/icon/IconHanaXConnector.ts) - ICON wallet connector

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

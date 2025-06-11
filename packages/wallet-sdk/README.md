# @sodax/wallet-sdk

A comprehensive wallet SDK for the Sodax ecosystem that provides unified wallet connectivity across multiple blockchain networks.

## Features

- 🔗 Multi-chain Support
  - EVM (Arbitrum, Avalanche, Base, BSC, Optimism, Polygon) ✅
  - Sui ❌ Coming soon
  - Solana ❌ Coming soon
  - Stellar ❌ Coming soon
  - Injective ❌ Coming soon
  - Havah ❌ Coming soon
  - ICON ❌ Coming soon

- 🔒 Wallet Integration
  - EVM Wallets: All browser extensions that support [EIP-6963](https://eips.ethereum.org/EIPS/eip-6963) (Hana Wallet, MetaMask, Phantom, etc.) ✅
  - Sui Wallets: ❌ Coming soon
  - Solana Wallets: ❌ Coming soon
  - Stellar Wallets: ❌ Coming soon
  - Injective Wallets: ❌ Coming soon
  - Havah Wallets: ❌ Coming soon
  - ICON Wallets: ❌ Coming soon

- 🛠️ Core Features
  - Unified wallet connection interface
  - Type-safe development with TypeScript
  - React hooks for easy integration

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

## API Reference

### Components

#### XWagmiProviders

The main provider component that enables wallet connectivity across multiple chains. It should be wrapped around your application.

```typescript
import { XWagmiProviders } from '@sodax/wallet-sdk';

function App() {
  return (
    <XWagmiProviders
      config={{
        EVM: {
          wagmiConfig: wagmiConfig, // Your wagmi configuration
        },
        SUI: {
          isMainnet: true,
        },
      }}
    >
      <YourApp />
    </XWagmiProviders>
  );
}
```

Configuration options for each chain:

- `EVM`: Requires a wagmi configuration object
- `SUI`: Supports `isMainnet` flag
- `SOLANA`: Requires an RPC endpoint
- Other chains: Currently support empty configuration objects

Note: Make sure to wrap `XWagmiProviders` inside a `QueryClientProvider` from `@tanstack/react-query` for proper functionality.

### Hooks

#### Core Wallet Hooks

- `useXConnectors(xChainType: XChainType)`: Get available wallet connectors for a specific blockchain
  ```typescript
  // Get EVM wallet connectors (MetaMask, WalletConnect, etc.)
  const evmConnectors = useXConnectors('EVM');
  
  // Get Solana wallet connectors (Phantom, etc.)
  const solanaConnectors = useXConnectors('SOLANA');
  
  // Get Sui wallet connectors
  const suiConnectors = useXConnectors('SUI');
  
  // Get Stellar wallet connectors
  const stellarConnectors = useXConnectors('STELLAR');
  
  // Example usage with useXConnect
  const { mutateAsync: connect } = useXConnect();
  const connectors = useXConnectors('EVM');
  
  // List of avilable EVM wallet connectors
  connectors.map((connector) => (
    <div key={connector.id} className="flex items-center gap-2" onClick={() => connect(connector)}>
      <img src={connector.icon} alt={connector.name} width={24} height={24} className="rounded-md" />
      <span>{connector.name}</span>
    </div>
  ));

- `useEvmSwitchChain()`: Switch between EVM chains
  ```typescript
  // Example usage in a component
  function SupplyButton({ token }: { token: XToken }) {
    const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(token.xChainId);
    const { mutateAsync: supply, isPending } = useSupply(token);

    return (
      <div>
        {isWrongChain ? (
          <Button onClick={handleSwitchChain}>
            Switch Chain
          </Button>
        ) : (
          <Button onClick={() => supply('100')} disabled={isPending}>
            {isPending ? 'Supplying...' : 'Supply'}
          </Button>
        )}
      </div>
    );
  }

  // The hook provides:
  // - isWrongChain: boolean indicating if the current chain is different from the required chain
  // - handleSwitchChain: function to switch to the required chain
  ```

- `useXBalances(params: { xChainId: XChainId; xTokens: XToken[]; address: string | undefined })`: Fetch token balances for multiple tokens on a specific chain
  ```typescript
  // Example usage in a component
  function TokenBalances({ tokens }: { tokens: XToken[] }) {
    const { address } = useXAccount('EVM');
    const { data: balances } = useXBalances({
      xChainId: '0xa86a.avax',
      xTokens: tokens,
      address,
    });

    return (
      <div>
        {tokens.map(token => (
          <div key={token.address}>
            {token.symbol}: {formatUnits(balances?.[token.address] || 0n, token.decimals)}
          </div>
        ))}
      </div>
    );
  }

  // Parameters:
  // - xChainId: Chain identifier (e.g. '0xa86a.avax', '0x1.base', '0x2.bsc', '0x89.polygon', '0x1.optimism')
  // - xTokens: Array of token objects to fetch balances for
  // - address: Wallet address to fetch balances for. If undefined, returns empty object
  //
  // Returns: UseQueryResult containing an object mapping token addresses to their balances as bigints.
  // The balances are denominated in the token's smallest unit (e.g. wei for ETH).
  // Returns empty object if wallet is not connected or service is unavailable.
  //
  // Features:
  // - Auto-refreshes every 5 seconds
  // - Keeps previous data while loading
  // - Enabled only when service is available
  ```

- `useXAccount(xChainType: XChainType)`: Get account information for a specific chain
  ```typescript
  const account = useXAccount('EVM');
  // Returns: { address: string | undefined, xChainType: XChainType | undefined }
  ```

- `useXService(xChainType: XChainType)`: Access chain-specific service instance
  ```typescript
  const service = useXService('EVM');
  // Returns: XService | undefined
  ```

- `useXConnection(xChainType: XChainType)`: Get connection details for a specific chain
  ```typescript
  const connection = useXConnection('EVM');
  // Returns: { xAccount: XAccount, xConnectorId: string } | undefined
  ```

#### Provider Hooks

- `useWalletProviderOptions(xChainId: XChainId)`: Get wallet provider options for a specific chain
  ```typescript
  const options = useWalletProviderOptions('ethereum');
  // Returns: { walletClient, publicClient } | undefined
  ```

### Constants

- `xChains`: Array of all supported chains in the Sodax ecosystem
  ```typescript
  const xChains = [
    {
      id: '0x1.icon',
      name: 'ICON',
      xChainId: '0x1.icon',
      xChainType: 'ICON',
      testnet: false
    },
    {
      id: 43114,
      name: 'Avalanche',
      xChainId: '0xa86a.avax',
      xChainType: 'EVM',
      testnet: false
    },
    // ... other chain configurations
  ];
  ```

  Currently supported chains:
  - EVM chains:
    - Arbitrum (0xa4b1.arbitrum)
    - Avalanche (0xa86a.avax)
    - Base (0x2105.base)
    - BSC (0x38.bsc)
    - Optimism (0xa.optimism)
    - Polygon (0x89.polygon)
    - Sonic (sonic)
    - Sonic Blaze (sonic-blaze)
  - ICON chains:
    - ICON (0x1.icon)
    - Lisbon (0x2.icon)
  - Other chains:
    - Archway (archway)
    - Injective (injective-1)
    - Solana (solana)
    - Stellar (stellar)
    - Sui (sui)

- `xChainMap`: Map of chain IDs to their configurations
  ```typescript
  const xChainMap: { [key in XChainId]: XChain } = {
    '0x1.icon': icon,
    '0x2.icon': lisbon,
    'archway': archwayTestnet,
    '0xa4b1.arbitrum': arbitrum,
    '0xa86a.avax': avalanche,
    // ... other chain configurations
  };
  ```

### Types

- `XAccount`: Represents a wallet account
  ```typescript
  type XAccount = {
    address: string | undefined;
    xChainType: XChainType | undefined;
  };
  ```

- `XConnection`: Represents a wallet connection
  ```typescript
  type XConnection = {
    xAccount: XAccount;
    xConnectorId: string;
  };
  ```

- `XConnector`: Represents a blockchain wallet connector
  ```typescript
  type XConnector = {
    id: string;
    name: string;
    icon: string;
    xChainType: XChainType;
    connect: () => Promise<XAccount>;
    disconnect: () => Promise<void>;
  };
  ```

- `XToken`: Represents a token across chains
  ```typescript
  type XToken = {
    xChainId: XChainId;
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
  ```

### Classes

#### XConnector

Base class for blockchain wallet connectors that provides a unified interface for wallet connections.

```typescript
abstract class XConnector {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly icon: string;
  abstract readonly xChainType: XChainType;

  /**
   * Connect to the wallet
   * @returns {Promise<XAccount>} Connected account information
   */
  abstract connect(): Promise<XAccount>;

  /**
   * Disconnect from the wallet
   * @returns {Promise<void>}
   */
  abstract disconnect(): Promise<void>;
}
```

Each blockchain implementation extends this base class to provide chain-specific wallet connection functionality:

- `EvmXConnector`: For EVM-compatible chains (MetaMask, WalletConnect, etc.)
- `SolanaXConnector`: For Solana wallets (Phantom, etc.)
- `SuiXConnector`: For Sui wallets
- `StellarXConnector`: For Stellar wallets
- `InjectiveXConnector`: For Injective wallets
- `HavahXConnector`: For Havah wallets
- `IconXConnector`: For ICON wallets

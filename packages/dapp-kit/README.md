# dApp Kit

dApp Kit is a collection of React components, hooks, and utilities designed to streamline dApp development within the Sodax ecosystem. It provides seamless integration with Sodax smart contracts, enabling easy data querying and transaction execution. Additionally, it offers built-in wallet connectivity for all supported wallets in the Sodax network, simplifying the user onboarding experience.

Under the hood, dApp Kit leverages @new-workd/xwagmi and @new-workd/sdk for seamless functionality.


## Features

- 🔒 Secure wallet integration
- 🔄 Transaction management
- 📱 Responsive UI components
- 🎨 Customizable themes
- 🚀 Type-safe development

## Installation

```bash
npm install @sodax/dapp-kit
# or
yarn add @sodax/dapp-kit
# or
pnpm add @sodax/dapp-kit
```

## Quick Start

```typescript
import { SodaxProvider } from '@sodax/dapp-kit';

function App() {
  return (
    <SodaxProvider>
      <YourApp />
    </SodaxProvider>
  );
}
```

## Usage

### Basic Setup

```typescript
import { useWallet } from '@sodax/dapp-kit';

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

## API Reference

### Components

- `SodaxProvider` - Main provider component for Sodax ecosystem integration

### Hooks

#### Wallet & Provider Hooks
- `useWalletProvider()` - Get wallet provider for a specific chain
- `useHubProvider()` - Get hub chain provider
- `useSpokeProvider()` - Get spoke chain provider

#### Money Market Hooks
- `useBorrow()` - Borrow tokens from the money market
- `useRepay()` - Repay borrowed tokens
- `useSupply()` - Supply tokens to the money market
- `useWithdraw()` - Withdraw supplied tokens
- `useSuppliedAssets()` - Get list of supplied assets
- `useHubWalletAddress()` - Get hub wallet address for a spoke chain

#### Swap Hooks
- `useQuote()` - Get quote for an intent order
- `useCreateIntentOrder()` - Create and submit an intent order
- `useStatus()` - Get status of an intent order

#### Shared Hooks
- `useSodaxContext()` - Access Sodax context and configuration
- `useAllowance()` - Check token allowance for a specific amount
- `useApprove()` - Approve token spending

Each hook provides:
- Type-safe parameters and return values
- Loading states
- Error handling
- Automatic data refetching where applicable

## Configuration

```typescript
import { SodaxProvider } from '@sodax/dapp-kit';

const config = {
  // Your configuration options
};

function App() {
  return (
    <SodaxProvider config={config}>
      <YourApp />
    </SodaxProvider>
  );
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

[MIT](LICENSE)

## Support

- [Documentation](https://docs.sodax.com/dapp-kit)
- [GitHub Issues](https://github.com/sodax/dapp-kit/issues)
- [Discord Community](https://discord.gg/sodax)

## Roadmap

- [ ] Multi-chain support
- [ ] Additional wallet integrations
- [ ] Enhanced transaction management

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes.
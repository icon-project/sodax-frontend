# @sodax/dapp-kit

dApp Kit is a collection of React components, hooks, and utilities designed to streamline dApp development within the Sodax ecosystem. It provides seamless integration with Sodax smart contracts, enabling easy data querying and transaction execution. Additionally, it offers built-in wallet connectivity for all supported wallets in the Sodax network, simplifying the user onboarding experience. Under the hood, dApp Kit leverages @sodax/wallet-kit and @sodax/sdk for seamless functionality.


## Features

- Money Market
  - Supply tokens to the money market (`useSupply`)
  - Withdraw tokens from the money market (`useWithdraw`)
  - Borrow tokens from the money market (`useBorrow`)
  - Repay borrowed tokens (`useRepay`)
  - Get user reserves data (`useUserReservesData`)
  - Get reserves data (`useReservesData`)
  - Check token allowance (`useMMAllowance`)
  - Approve token spending (`useMMApprove`)

- Swap/Intent
  - Get quote for an intent order (`useQuote`)
  - Create and submit an intent order (`useCreateIntentOrder`)
  - Get status of an intent order (`useStatus`)
  - Check token allowance (`useSwapAllowance`)
  - Approve token spending (`useSwapApprove`)

- Provider
  - Get hub chain provider (`useHubProvider`)
  - Get spoke chain provider (`useSpokeProvider`)
  - Get wallet provider (`useWalletProvider`)

## Installation

```bash
npm install @sodax/dapp-kit
# or
yarn add @sodax/dapp-kit
# or
pnpm add @sodax/dapp-kit
```

## Quick Start

1. First, install the required dependencies:

```bash
npm install @sodax/dapp-kit @tanstack/react-query @sodax/wallet-sdk-react
```

2. Set up the providers in your app:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { XWagmiProviders } from '@sodax/wallet-sdk-react';
import { SodaxProvider } from '@sodax/dapp-kit';
import { SONIC_MAINNET_CHAIN_ID } from '@sodax/types';

const queryClient = new QueryClient();

// Configure Sodax
const sodaxConfig = {
  hubProviderConfig: {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
  },
  moneyMarket: getMoneyMarketConfig(SONIC_MAINNET_CHAIN_ID),
  solver: {
    intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef',
    solverApiEndpoint: 'https://sodax-solver-staging.iconblockchain.xyz',
    partnerFee: {
      address: '0x0Ab764AB3816cD036Ea951bE973098510D8105A6',
      percentage: 100, // 1%
    },
  },
  relayerApiEndpoint: 'https://xcall-relay.nw.iconblockchain.xyz',
};

function App() {
  return (
    <SodaxProvider testnet={false} config={sodaxConfig}>
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
              endpoint: 'https://solana-mainnet.g.alchemy.com/v2/your-api-key',
            },
          }}
        >
          <YourApp />
        </XWagmiProviders>
      </QueryClientProvider>
    </SodaxProvider>
  );
}
```

3. Use the hooks in your components:

```typescript
// Connect Wallet Operations
import { useXConnectors, useXConnect, useXAccount } from '@sodax/wallet-sdk-react';
const evmConnectors = useXConnectors('EVM');
const { mutateAsync: connect, isPending } = useXConnect();
const account = useXAccount('EVM');

const handleConnect = () => {
  connect(evmConnectors[0]);
};

return (
  <div>
    <button onClick={handleConnect}>Connect EVM Wallet</button>
    <div>Connected wallet: {account.address}</div>
  </div>
);

// Money Market Operations
import { useSupply, useWithdraw, useBorrow, useRepay, useUserReservesData } from '@sodax/dapp-kit';

function MoneyMarketComponent() {
  // Supply tokens
  const { mutateAsync: supply, isPending: isSupplying } = useSupply(token);
  const handleSupply = async (amount: string) => {
    await supply(amount);
  };

  // Withdraw tokens
  const { mutateAsync: withdraw, isPending: isWithdrawing } = useWithdraw(token, chainId);
  const handleWithdraw = async (amount: string) => {
    await withdraw(amount);
  };

  // Borrow tokens
  const { mutateAsync: borrow, isPending: isBorrowing } = useBorrow(token, chainId);
  const handleBorrow = async (amount: string) => {
    await borrow(amount);
  };

  // Get user's supplied assets
  const userReserves = useUserReservesData(chainId);
}

// Token Management
import { useMMAllowance, useApprove } from '@sodax/dapp-kit';

function TokenManagementComponent() {
  // Check token allowance
  const { data: hasAllowed } = useMMAllowance(token, amount);
  
  // Approve token spending
  const { approve, isLoading: isApproving } = useApprove(token);
  const handleApprove = async (amount: string) => {
    await approve(amount);
  };
}

// Swap Operations
import { useQuote, useCreateIntentOrder, useStatus } from '@sodax/dapp-kit';

function SwapComponent() {
  // Get quote for an intent order
  const { data: quote, isLoading: isQuoteLoading } = useQuote({
    token_src: '0x...',
    token_src_blockchain_id: '0xa86a.avax',
    token_dst: '0x...',
    token_dst_blockchain_id: '0xa4b1.arbitrum',
    amount: '1000000000000000000',
    quote_type: 'exact_input',
  });

  // Create and submit an intent order
  const { mutateAsync: createOrder, isPending: isCreating } = useCreateIntentOrder();
  const handleCreateOrder = async () => {
    const order = await createOrder({
      token_src: '0x...',
      token_src_blockchain_id: '0xa86a.avax',
      token_dst: '0x...',
      token_dst_blockchain_id: '0xa4b1.arbitrum',
      amount: '1000000000000000000',
      quote_type: 'exact_input',
    });
  };

  // Get status of an intent order
  const { data: orderStatus } = useStatus('0x...');
}
```

## Requirements

- Node.js >= 18.0.0
- React >= 19
- TypeScript

## API Reference

### Components

- [`SodaxProvider`](./src/providers/SodaxProvider.tsx) - Main provider component for Sodax ecosystem integration

### Hooks

#### Money Market Hooks
- [`useBorrow()`](./src/hooks/mm/useBorrow.ts) - Borrow tokens from the money market
- [`useRepay()`](./src/hooks/mm/useRepay.ts) - Repay borrowed tokens
- [`useSupply()`](./src/hooks/mm/useSupply.ts) - Supply tokens to the money market
- [`useWithdraw()`](./src/hooks/mm/useWithdraw.ts) - Withdraw supplied tokens
- [`useUserReservesData()`](./src/hooks/mm/useUserReservesData.ts) - Get user's reserves data(supplied asset and debt)
- [`useReservesData()`](./src/hooks/mm/useReservesData.ts) - Get reserves data
- [`useMMAllowance()`](./src/hooks/mm/useMMAllowance.ts) - Check token allowance for a specific amount
- [`useMMApprove()`](./src/hooks/mm/useMMApprove.ts) - Approve token spending

#### Swap Hooks
- [`useQuote()`](./src/hooks/swap/useQuote.ts) - Get quote for an intent order
- [`useCreateIntentOrder()`](./src/hooks/swap/useCreateIntentOrder.ts) - Create and submit an intent order
- [`useStatus()`](./src/hooks/swap/useStatus.ts) - Get status of an intent order
- [`useSwapAllowance()`](./src/hooks/swap/useSwapAllowance.ts) - Check token allowance for an intent order
- [`useSwapApprove()`](./src/hooks/swap/useSwapApprove.ts) - Approve token spending

#### Shared Hooks
- [`useSodaxContext()`](./src/hooks/shared/useSodaxContext.ts) - Access Sodax context and configuration
- [`useEstimateGas()`](./src/hooks/shared/useEstimateGas.ts) - Estimate gas costs for transactions


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

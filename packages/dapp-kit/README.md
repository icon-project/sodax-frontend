# @sodax/dapp-kit

dApp Kit is a collection of React components, hooks, and utilities designed to streamline dApp development within the Sodax ecosystem. It provides seamless integration with Sodax smart contracts, enabling easy data querying and transaction execution. Additionally, it offers built-in wallet connectivity for all supported wallets in the Sodax network, simplifying the user onboarding experience. Under the hood, dApp Kit leverages @sodax/wallet-kit and @sodax/sdk for seamless functionality.


## Features

- Money Market
  - Supply tokens to the money market (`useSupply`)
  - Withdraw tokens from the money market (`useWithdraw`)
  - Borrow tokens from the money market (`useBorrow`)
  - Repay borrowed tokens (`useRepay`)
  - Check token allowance (`useMMAllowance`)
  - Approve token spending (`useMMApprove`)
  - Get user reserves data (`useUserReservesData`)
  - Get reserves data (`useReservesData`)
  - Get humanized reserves data (`useReservesHumanized`)
  - Get list of reserves (`useReservesList`)
  - Get USD formatted reserves data (`useReservesUsdFormat`)
  - Get formatted user portfolio summary (`useUserFormattedSummary`)

- Swap/Intent
  - Get quote for an intent order (`useQuote`)
  - Create and submit an swap intent order (`useSwap`)
  - Get status of an intent order (`useStatus`)
  - Check token allowance (`useSwapAllowance`)
  - Approve token spending (`useSwapApprove`)
  - Cancel a swap intent order (`useCancelSwap`)

- Provider
  - Get hub chain provider (`useHubProvider`)
  - Get spoke chain provider (`useSpokeProvider`)
  - Get wallet provider (`useWalletProvider`)

- Bridge
  - Bridge tokens between chains (`useBridge`)
  - Check token allowance for bridging (`useBridgeAllowance`)
  - Approve source token for bridging (`useBridgeApprove`)
  - Get max amount available to be bridged (`useGetBridgeableAmount`)
  - Get available destination tokens based on provided source token (`useGetBridgeableTokens`)

- Shared
  - Derive user wallet address for hub abstraction (`useDeriveUserWalletAddress`)
  - Check if Stellar trustline is established for an asset (`useStellarTrustlineCheck`)
  - Request creation of Stellar trustline line for an asset (`useRequestTrustline`)

- Staking
  - Stake SODA tokens to receive xSODA shares (`useStake`)
  - Unstake xSODA shares (`useUnstake`)
  - Instant unstake xSODA shares with penalty (`useInstantUnstake`)
  - Claim unstaked SODA tokens after unstaking period (`useClaim`)
  - Cancel unstake request (`useCancelUnstake`)
  - Check SODA token allowance for staking (`useStakeAllowance`)
  - Approve SODA token spending for staking (`useStakeApprove`)
  - Check xSODA token allowance for unstaking (`useUnstakeAllowance`)
  - Approve xSODA token spending for unstaking (`useUnstakeApprove`)
  - Check xSODA token allowance for instant unstaking (`useInstantUnstakeAllowance`)
  - Approve xSODA token spending for instant unstaking (`useInstantUnstakeApprove`)
  - Get comprehensive staking information (`useStakingInfo`)
  - Get unstaking information with penalty details (`useUnstakingInfoWithPenalty`)
  - Get unstaking information (`useUnstakingInfo`)
  - Get staking configuration (`useStakingConfig`)
  - Get stake ratio (SODA to xSODA conversion rate) (`useStakeRatio`)
  - Get instant unstake ratio (xSODA to SODA conversion rate with penalty) (`useInstantUnstakeRatio`)
  - Get converted assets amount for xSODA shares (`useConvertedAssets`)

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
pnpm install @sodax/dapp-kit @tanstack/react-query @sodax/wallet-sdk-react
```

2. Set up the providers in your app:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SodaxWalletProvider } from '@sodax/wallet-sdk-react';
import { SodaxProvider } from '@sodax/dapp-kit';
import type { RpcConfig } from '@sodax/types';

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
    <SodaxProvider testnet={false} rpcConfig={rpcConfig}>
      <QueryClientProvider client={queryClient}>
        <SodaxWalletProvider rpcConfig={rpcConfig}>
          <YourApp />
        </SodaxWalletProvider>
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

// Wallet Address Derivation
import { useDeriveUserWalletAddress, useSpokeProvider } from '@sodax/dapp-kit';

function WalletAddressComponent() {
  const spokeProvider = useSpokeProvider(chainId, walletProvider);
  
  // Derive user wallet address for hub abstraction
  const { data: derivedAddress, isLoading, error } = useDeriveUserWalletAddress(spokeProvider, userAddress);
  
  return (
    <div>
      {isLoading && <div>Deriving wallet address...</div>}
      {error && <div>Error: {error.message}</div>}
      {derivedAddress && <div>Derived Address: {derivedAddress}</div>}
    </div>
  );
}

// Swap Operations
import { useQuote, useSwap, useStatus } from '@sodax/dapp-kit';

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
  const { mutateAsync: swap, isPending: isCreating } = useSwap();
  const handleSwap = async () => {
    const order = await swap({
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

// Bridge Operations
import { useBridge, useBridgeAllowance, useBridgeApprove, useGetBridgeableAmount, useGetBridgeableTokens } from '@sodax/dapp-kit';

function BridgeComponent() {
  const spokeProvider = useSpokeProvider(chainId, walletProvider);
  
  // Get available destination tokens for bridging
  const { data: bridgeableTokens, isLoading: isTokensLoading } = useGetBridgeableTokens(
    '0x2105.base', // from chain
    '0x89.polygon', // to chain
    '0x...' // source token address
  );

  // Get maximum amount available to bridge
  const { data: bridgeableAmount } = useGetBridgeableAmount(
    { address: '0x...', xChainId: '0x2105.base' }, // from token
    { address: '0x...', xChainId: '0x89.polygon' } // to token
  );

  // Check token allowance for bridge
  const { data: hasAllowed } = useBridgeAllowance(bridgeParams, spokeProvider);
  
  // Approve tokens for bridge
  const { approve: approveBridge, isLoading: isApproving } = useBridgeApprove(spokeProvider);
  const handleApprove = async () => {
    await approveBridge(bridgeParams);
  };

  // Execute bridge transaction
  const { mutateAsync: bridge, isPending: isBridging } = useBridge(spokeProvider);
  const handleBridge = async () => {
    const result = await bridge({
      srcChainId: '0x2105.base',
      srcAsset: '0x...',
      amount: 1000n,
      dstChainId: '0x89.polygon',
      dstAsset: '0x...',
      recipient: '0x...'
    });

    console.log('Bridge transaction hashes:', {
      spokeTxHash: result.value[0],
      hubTxHash: result.value[1]
    });
  };
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
- [`useAToken()`](./src/hooks/mm/useAToken.ts) - Fetch aToken token data

#### Swap Hooks
- [`useQuote()`](./src/hooks/swap/useQuote.ts) - Get quote for an intent order
- [`useSwap()`](./src/hooks/swap/useSwap.ts) - Create and submit an intent order
- [`useStatus()`](./src/hooks/swap/useStatus.ts) - Get status of an intent order
- [`useSwapAllowance()`](./src/hooks/swap/useSwapAllowance.ts) - Check token allowance for an intent order
- [`useSwapApprove()`](./src/hooks/swap/useSwapApprove.ts) - Approve token spending
- [`useCancelSwap()`](./src/hooks/swap/useCancelSwap.ts) - Cancel a swap intent order

#### Shared Hooks
- [`useSodaxContext()`](./src/hooks/shared/useSodaxContext.ts) - Access Sodax context and configuration
- [`useEstimateGas()`](./src/hooks/shared/useEstimateGas.ts) - Estimate gas costs for transactions
- [`useDeriveUserWalletAddress()`](./src/hooks/shared/useDeriveUserWalletAddress.ts) - Derive user wallet address for hub abstraction

#### Bridge Hooks
- [`useBridge()`](./src/hooks/bridge/useBridge.ts) - Execute bridge transactions to transfer tokens between chains
- [`useBridgeAllowance()`](./src/hooks/bridge/useBridgeAllowance.ts) - Check token allowance for bridge operations
- [`useBridgeApprove()`](./src/hooks/bridge/useBridgeApprove.ts) - Approve token spending for bridge actions
- [`useGetBridgeableAmount()`](./src/hooks/bridge/useGetBridgeableAmount.ts) - Get maximum amount available to be bridged
- [`useGetBridgeableTokens()`](./src/hooks/bridge/useGetBridgeableTokens.ts) - Get available destination tokens for bridging

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

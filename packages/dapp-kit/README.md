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
// Money Market Operations
import { useSupply, useWithdraw, useBorrow, useRepay, useUserReservesData, useMMAllowance, useMMApprove } from '@sodax/dapp-kit';
import { parseUnits } from 'viem';
import { useMemo, useState } from 'react';

function MoneyMarketComponent() {
  const [amount, setAmount] = useState<string>('');
  const spokeProvider = useSpokeProvider(chainId, walletProvider);

  // Supply tokens
  const supplyParams = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
      action: 'supply' as const,
    };
  }, [token.address, token.decimals, amount]);

  const { data: hasSupplyAllowed, isLoading: isSupplyAllowanceLoading } = useMMAllowance(supplyParams, spokeProvider);
  const { mutateAsync: approveSupply, isPending: isApprovingSupply, error: approveSupplyError } = useMMApprove();
  const { mutateAsync: supply, isPending: isSupplying, error: supplyError } = useSupply();

  const handleApproveSupply = async () => {
    if (!spokeProvider || !supplyParams) return;
    try {
      await approveSupply({ params: supplyParams, spokeProvider });
    } catch (err) {
      console.error('Error approving supply:', err);
    }
  };

  const handleSupply = async () => {
    if (!spokeProvider || !supplyParams) return;
    try {
      await supply({ params: supplyParams, spokeProvider });
    } catch (err) {
      console.error('Error supplying:', err);
    }
  };

  // Withdraw tokens
  const withdrawParams = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, 18), // vault token on hub chain decimals is 18
      action: 'withdraw' as const,
    };
  }, [token.address, amount]);

  const { data: hasWithdrawAllowed, isLoading: isWithdrawAllowanceLoading } = useMMAllowance(withdrawParams, spokeProvider);
const { data: hasWithdrawAllowed, isLoading: isWithdrawAllowanceLoading } = useMMAllowance({ params: withdrawParams, spokeProvider });

  const { mutateAsync: approveWithdraw, isPending: isApprovingWithdraw, error: approveWithdrawError } = useMMApprove();
  const { mutateAsync: withdraw, isPending: isWithdrawing, error: withdrawError } = useWithdraw();

  const handleApproveWithdraw = async () => {
    if (!spokeProvider || !withdrawParams) return;
    try {
      await approveWithdraw({ params: withdrawParams, spokeProvider });
    } catch (err) {
      console.error('Error approving withdraw:', err);
    }
  };

  const handleWithdraw = async () => {
    if (!spokeProvider || !withdrawParams) return;
    try {
      await withdraw({ params: withdrawParams, spokeProvider });
    } catch (err) {
      console.error('Error withdrawing:', err);
    }
  };

  // Borrow tokens
  const borrowParams = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, 18),
      action: 'borrow' as const,
    };
  }, [token.address, amount]);

  const { data: hasBorrowAllowed, isLoading: isBorrowAllowanceLoading } = useMMAllowance({ params: borrowParams, spokeProvider });
  const { mutateAsync: approveBorrow, isPending: isApprovingBorrow, error: approveBorrowError } = useMMApprove();
  const { mutateAsync: borrow, isPending: isBorrowing, error: borrowError } = useBorrow();

  const handleApproveBorrow = async () => {
    if (!spokeProvider || !borrowParams) return;
    try {
      await approveBorrow({ params: borrowParams, spokeProvider });
    } catch (err) {
      console.error('Error approving borrow:', err);
    }
  };

  const handleBorrow = async () => {
    if (!spokeProvider || !borrowParams) return;
    try {
      await borrow({ params: borrowParams, spokeProvider });
    } catch (err) {
      console.error('Error borrowing:', err);
    }
  };

  // Repay tokens
  const repayParams = useMemo(() => {
    if (!amount) return undefined;
    return {
      token: token.address,
      amount: parseUnits(amount, token.decimals),
      action: 'repay' as const,
    };
  }, [token.address, token.decimals, amount]);

  const { data: hasRepayAllowed, isLoading: isRepayAllowanceLoading } = useMMAllowance({ params: repayParams, spokeProvider });
  const { mutateAsync: approveRepay, isPending: isApprovingRepay, error: approveRepayError } = useMMApprove();
  const { mutateAsync: repay, isPending: isRepaying, error: repayError } = useRepay();

  const handleApproveRepay = async () => {
    if (!spokeProvider || !repayParams) return;
    try {
      await approveRepay({ params: repayParams, spokeProvider });
    } catch (err) {
      console.error('Error approving repay:', err);
    }
  };

  const handleRepay = async () => {
    if (!spokeProvider || !repayParams) return;
    try {
      await repay({ params: repayParams, spokeProvider });
    } catch (err) {
      console.error('Error repaying:', err);
    }
  };

  // Get user's supplied assets
  const userReserves = useUserReservesData(chainId);
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

- [`SodaxProvider`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/providers/SodaxProvider.tsx) - Main provider component for Sodax ecosystem integration

### Hooks

#### Money Market Hooks
- [`useBorrow()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useBorrow.ts) - Borrow tokens from the money market
- [`useRepay()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useRepay.ts) - Repay borrowed tokens
- [`useSupply()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useSupply.ts) - Supply tokens to the money market
- [`useWithdraw()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useWithdraw.ts) - Withdraw supplied tokens
- [`useUserReservesData()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useUserReservesData.ts) - Get user's reserves data(supplied asset and debt)
- [`useReservesData()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useReservesData.ts) - Get reserves data
- [`useMMAllowance()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useMMAllowance.ts) - Check token allowance for a specific amount
- [`useMMApprove()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useMMApprove.ts) - Approve token spending
- [`useAToken()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useAToken.ts) - Fetch aToken token data

#### Swap Hooks
- [`useQuote()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useQuote.ts) - Get quote for an intent order
- [`useSwap()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useSwap.ts) - Create and submit an intent order
- [`useCreateLimitOrder()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useCreateLimitOrder.ts) - Create a limit order intent (no deadline, must be cancelled manually)
- **Note**: Limit orders use `useSwapAllowance()` for checking token allowance (same as swaps)
- **Note**: Limit orders use `useSwapApprove()` for approving token spending (same as swaps)
- **Note**: Limit orders use `useCancelSwap()` for cancelling (same as swaps)
- [`useStatus()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useStatus.ts) - Get status of an intent order
- [`useSwapAllowance()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useSwapAllowance.ts) - Check token allowance for an intent order
- [`useSwapApprove()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useSwapApprove.ts) - Approve token spending
- [`useCancelSwap()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useCancelSwap.ts) - Cancel a swap intent order

#### Shared Hooks
- [`useSodaxContext()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/shared/useSodaxContext.ts) - Access Sodax context and configuration
- [`useEstimateGas()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/shared/useEstimateGas.ts) - Estimate gas costs for transactions
- [`useDeriveUserWalletAddress()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/shared/useDeriveUserWalletAddress.ts) - Derive user wallet address for hub abstraction

#### Bridge Hooks
- [`useBridge()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useBridge.ts) - Execute bridge transactions to transfer tokens between chains
- [`useBridgeAllowance()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useBridgeAllowance.ts) - Check token allowance for bridge operations
- [`useBridgeApprove()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useBridgeApprove.ts) - Approve token spending for bridge actions
- [`useGetBridgeableAmount()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useGetBridgeableAmount.ts) - Get maximum amount available to be bridged
- [`useGetBridgeableTokens()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useGetBridgeableTokens.ts) - Get available destination tokens for bridging

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

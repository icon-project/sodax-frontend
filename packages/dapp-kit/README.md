# @sodax/dapp-kit

dApp Kit is a collection of React components, hooks, and utilities designed to streamline dApp development within the Sodax ecosystem. It provides seamless integration with Sodax smart contracts, enabling easy data querying and transaction execution. Additionally, it offers built-in wallet connectivity for all supported wallets in the Sodax network, simplifying the user onboarding experience. Under the hood, dApp Kit leverages @sodax/wallet-sdk-react and @sodax/sdk for seamless functionality.

## Installation

```bash
npm install @sodax/dapp-kit @tanstack/react-query @sodax/wallet-sdk-react @sodax/sdk @sodax/types
# or
yarn add @sodax/dapp-kit @tanstack/react-query @sodax/wallet-sdk-react @sodax/sdk @sodax/types
# or
pnpm add @sodax/dapp-kit @tanstack/react-query @sodax/wallet-sdk-react @sodax/sdk @sodax/types
```

## Quick Start

1. **First, install the required dependencies:**

    ```bash
    pnpm install @sodax/dapp-kit @tanstack/react-query @sodax/wallet-sdk-react @sodax/sdk @sodax/types
    ```

2. **Set up reliable RPC endpoints for production:**

   For production-ready applications, it's essential to use private RPC endpoints provided by third-party services rather than public RPCs. Public RPCs often have rate limits, reliability issues, and may not be suitable for production workloads.

   **Recommended RPC providers by chain:**

   - **EVM chains** (Sonic, Avalanche, Arbitrum, Base, BSC, Optimism, Polygon, LightLink, etc.):
     - For most EVM chains (Sonic, Avalanche, Arbitrum, Base, BSC, Optimism, Polygon, etc.), use reliable private endpoints from providers such as [Alchemy](https://www.alchemy.com/) or [QuickNode](https://www.quicknode.com/) for production usage.
     - **LightLink (Phoenix Mainnet):** Use the public RPC endpoint recommended in the [official LightLink documentation](https://docs.lightlink.io/lightlink-protocol/building-on-lightlink/live-networks):
   - **Solana:** Use [Alchemy](https://www.alchemy.com/) or [QuickNode](https://www.quicknode.com/).
   - **Stellar:** Use [QuickNode](https://www.quicknode.com/).
   - **Sui:** Use [Alchemy](https://www.alchemy.com/) or [QuickNode](https://www.quicknode.com/).
   - **Injective:** Use [QuickNode](https://www.quicknode.com/).
   - **ICON:** Use the public RPC endpoint recommended in the [official ICON documentation](https://docs.icon.community/develop-on-icon-chain/networks#rpc-endpoints).

   After signing up with your chosen provider, you'll receive private RPC endpoints that you can use in your `rpcConfig`. These endpoints typically include an API key in the URL for authentication and rate limit management.

3. **Set up the providers in your app:**

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

4. **Use the hooks in your components:**

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
    import { useState } from 'react';
    import { useSupply, useWithdraw, useBorrow, useRepay, useMMAllowance, useMMApprove, useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
    import { useWalletProvider } from '@sodax/wallet-sdk-react';
    import type { XToken } from '@sodax/types';

    function MoneyMarketComponent({ token }: { token: XToken }) {
      const walletProvider = useWalletProvider(token.xChainId);
      const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);
      const [amount, setAmount] = useState<string>('1000000000000000000'); // 1 token in wei

      // Supply tokens
      const { mutateAsync: supply, isPending: isSupplying, error: supplyError } = useSupply(token, spokeProvider);
      const { data: hasSupplyAllowed, isLoading: isSupplyAllowanceLoading } = useMMAllowance(token, amount, 'supply', spokeProvider);
      const { approve: approveSupply, isLoading: isApprovingSupply } = useMMApprove(token, spokeProvider);

      const handleSupply = async () => {
        try {
          // First approve if needed
          if (!hasSupplyAllowed) {
            await approveSupply({ amount, action: 'supply' });
          }
          // Then supply
          await supply(amount);
        } catch (err) {
          console.error('Error supplying tokens:', err);
        }
      };

      // Withdraw tokens
      const { mutateAsync: withdraw, isPending: isWithdrawing, error: withdrawError } = useWithdraw(token, spokeProvider);
      const { data: hasWithdrawAllowed, isLoading: isWithdrawAllowanceLoading } = useMMAllowance(token, amount, 'withdraw', spokeProvider);
      const { approve: approveWithdraw, isLoading: isApprovingWithdraw } = useMMApprove(token, spokeProvider);

      const handleWithdraw = async () => {
        try {
          // First approve if needed
          if (!hasWithdrawAllowed) {
            await approveWithdraw({ amount, action: 'withdraw' });
          }
          // Then withdraw
          await withdraw(amount);
        } catch (err) {
          console.error('Error withdrawing tokens:', err);
        }
      };

      // Borrow tokens
      const { mutateAsync: borrow, isPending: isBorrowing, error: borrowError } = useBorrow(token, spokeProvider);
      const { data: hasBorrowAllowed, isLoading: isBorrowAllowanceLoading } = useMMAllowance(token, amount, 'borrow', spokeProvider);
      const { approve: approveBorrow, isLoading: isApprovingBorrow } = useMMApprove(token, spokeProvider);

      const handleBorrow = async () => {
        try {
          // First approve if needed
          if (!hasBorrowAllowed) {
            await approveBorrow({ amount, action: 'borrow' });
          }
          // Then borrow
          await borrow(amount);
        } catch (err) {
          console.error('Error borrowing tokens:', err);
        }
      };

      // Repay tokens
      const { mutateAsync: repay, isPending: isRepaying, error: repayError } = useRepay(token, spokeProvider);
      const { data: hasRepayAllowed, isLoading: isRepayAllowanceLoading } = useMMAllowance(token, amount, 'repay', spokeProvider);
      const { approve: approveRepay, isLoading: isApprovingRepay } = useMMApprove(token, spokeProvider);

      const handleRepay = async () => {
        try {
          // First approve if needed
          if (!hasRepayAllowed) {
            await approveRepay({ amount, action: 'repay' });
          }
          // Then repay
          await repay(amount);
        } catch (err) {
          console.error('Error repaying tokens:', err);
        }
      };

      // Get user's supplied assets
      const userReserves = useUserReservesData(token.xChainId);

      return (
        <div>
          <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button onClick={handleSupply} disabled={isSupplying || isApprovingSupply}>
            {isApprovingSupply ? 'Approving...' : isSupplying ? 'Supplying...' : 'Supply'}
          </button>
          <button onClick={handleWithdraw} disabled={isWithdrawing || isApprovingWithdraw}>
            {isApprovingWithdraw ? 'Approving...' : isWithdrawing ? 'Withdrawing...' : 'Withdraw'}
          </button>
          <button onClick={handleBorrow} disabled={isBorrowing || isApprovingBorrow}>
            {isApprovingBorrow ? 'Approving...' : isBorrowing ? 'Borrowing...' : 'Borrow'}
          </button>
          <button onClick={handleRepay} disabled={isRepaying || isApprovingRepay}>
            {isApprovingRepay ? 'Approving...' : isRepaying ? 'Repaying...' : 'Repay'}
          </button>
          {userReserves?.data && (
            <div>Your reserves: {JSON.stringify(userReserves.data)}</div>
          )}
        </div>
      );
    }

    // Swap Operations
    import { useQuote, useSwap, useStatus, useSpokeProvider } from '@sodax/dapp-kit';
    import { useWalletProvider } from '@sodax/wallet-sdk-react';
    import { type CreateIntentParams } from '@sodax/sdk';
    import { parseUnits } from 'viem';
    import type { SpokeChainId } from '@sodax/types';

    function SwapComponent() {
      const sourceChain: SpokeChainId = '0xa86a.avax';
      const destChain: SpokeChainId = '0xa4b1.arbitrum';
      const sourceWalletProvider = useWalletProvider(sourceChain);
      const sourceProvider = useSpokeProvider(sourceChain, sourceWalletProvider);

      // Get quote for an intent order
      const { data: quote, isLoading: isQuoteLoading } = useQuote({
        token_src: '0x...',
        token_src_blockchain_id: sourceChain,
        token_dst: '0x...',
        token_dst_blockchain_id: destChain,
        amount: '1000000000000000000',
        quote_type: 'exact_input',
      });

      // Create and submit an intent order
      const { mutateAsync: swap } = useSwap(sourceProvider);
      const handleSwap = async () => {
        if (!sourceProvider) {
          console.error('Source provider not available');
          return;
        }

        const intentOrderPayload: CreateIntentParams = {
          inputToken: '0x...', // The address of the input token on hub chain
          outputToken: '0x...', // The address of the output token on hub chain
          inputAmount: parseUnits('1', 18), // The amount of input tokens
          minOutputAmount: BigInt('900000000000000000'), // The minimum amount of output tokens to accept
          deadline: BigInt(Math.floor(Date.now() / 1000) + 60 * 5), // Optional timestamp after which intent expires
          allowPartialFill: false, // Whether the intent can be partially filled
          srcChain: sourceChain, // Chain ID where input tokens originate
          dstChain: destChain, // Chain ID where output tokens should be delivered
          srcAddress: await sourceProvider.walletProvider.getWalletAddress(), // Source address
          dstAddress: '0x...', // Destination address
          solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
          data: '0x', // Additional arbitrary data
        };

        const result = await swap(intentOrderPayload);

        if (result.ok) {
          const [response, intent, intentDeliveryInfo] = result.value;
          console.log('Swap successful:', {
            intentHash: response.intent_hash,
            intent,
            intentDeliveryInfo,
          });
        } else {
          console.error('Error creating and submitting intent:', result.error);
        }
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

- [`useSupply()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useSupply.ts) - Supply tokens to the money market
- [`useWithdraw()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useWithdraw.ts) - Withdraw supplied tokens
- [`useBorrow()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useBorrow.ts) - Borrow tokens from the money market
- [`useRepay()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useRepay.ts) - Repay borrowed tokens
- [`useMMAllowance()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useMMAllowance.ts) - Check token allowance for a specific amount
- [`useMMApprove()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useMMApprove.ts) - Approve token spending
- [`useUserReservesData()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useUserReservesData.ts) - Get user's reserves data (supplied asset and debt)
- [`useReservesData()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useReservesData.ts) - Get reserves data
- [`useReservesHumanized()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useReservesHumanized.ts) - Get humanized reserves data
- [`useReservesList()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useReservesList.ts) - Get list of reserves
- [`useReservesUsdFormat()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useReservesUsdFormat.ts) - Get USD formatted reserves data
- [`useUserFormattedSummary()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useUserFormattedSummary.ts) - Get formatted user portfolio summary
- [`useAToken()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/mm/useAToken.ts) - Fetch aToken token data

#### Swap Hooks

- [`useQuote()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useQuote.ts) - Get quote for an intent order
- [`useSwap()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useSwap.ts) - Create and submit an intent order
- [`useStatus()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useStatus.ts) - Get status of an intent order
- [`useSwapAllowance()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useSwapAllowance.ts) - Check token allowance for an intent order
- [`useSwapApprove()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useSwapApprove.ts) - Approve token spending
- [`useCancelSwap()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/swap/useCancelSwap.ts) - Cancel a swap intent order

#### Provider Hooks

- [`useHubProvider()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/provider/useHubProvider.ts) - Get hub chain provider
- [`useSpokeProvider()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/provider/useSpokeProvider.ts) - Get spoke chain provider
- [`useWalletProvider()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/wallet-sdk-react/src/hooks/useWalletProvider.ts) - Get wallet provider

#### Bridge Hooks

- [`useBridge()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useBridge.ts) - Execute bridge transactions to transfer tokens between chains
- [`useBridgeAllowance()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useBridgeAllowance.ts) - Check token allowance for bridge operations
- [`useBridgeApprove()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useBridgeApprove.ts) - Approve token spending for bridge actions
- [`useGetBridgeableAmount()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useGetBridgeableAmount.ts) - Get maximum amount available to be bridged
- [`useGetBridgeableTokens()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/bridge/useGetBridgeableTokens.ts) - Get available destination tokens for bridging

#### Shared Hooks

- [`useSodaxContext()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/shared/useSodaxContext.ts) - Access Sodax context and configuration
- [`useEstimateGas()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/shared/useEstimateGas.ts) - Estimate gas costs for transactions
- [`useDeriveUserWalletAddress()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/shared/useDeriveUserWalletAddress.ts) - Derive user wallet address for hub abstraction
- [`useStellarTrustlineCheck()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/shared/useStellarTrustlineCheck.ts) - Check if Stellar trustline is established for an asset
- [`useRequestTrustline()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/shared/useRequestTrustline.ts) - Request creation of Stellar trustline for an asset

#### Staking Hooks

- [`useStake()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useStake.ts) - Stake SODA tokens to receive xSODA shares
- [`useUnstake()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useUnstake.ts) - Unstake xSODA shares
- [`useInstantUnstake()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useInstantUnstake.ts) - Instant unstake xSODA shares with penalty
- [`useClaim()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useClaim.ts) - Claim unstaked SODA tokens after unstaking period
- [`useCancelUnstake()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useCancelUnstake.ts) - Cancel unstake request
- [`useStakeAllowance()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useStakeAllowance.ts) - Check SODA token allowance for staking
- [`useStakeApprove()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useStakeApprove.ts) - Approve SODA token spending for staking
- [`useUnstakeAllowance()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useUnstakeAllowance.ts) - Check xSODA token allowance for unstaking
- [`useUnstakeApprove()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useUnstakeApprove.ts) - Approve xSODA token spending for unstaking
- [`useInstantUnstakeAllowance()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useInstantUnstakeAllowance.ts) - Check xSODA token allowance for instant unstaking
- [`useInstantUnstakeApprove()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useInstantUnstakeApprove.ts) - Approve xSODA token spending for instant unstaking
- [`useStakingInfo()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useStakingInfo.ts) - Get comprehensive staking information
- [`useUnstakingInfoWithPenalty()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useUnstakingInfoWithPenalty.ts) - Get unstaking information with penalty details
- [`useUnstakingInfo()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useUnstakingInfo.ts) - Get unstaking information
- [`useStakingConfig()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useStakingConfig.ts) - Get staking configuration
- [`useStakeRatio()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useStakeRatio.ts) - Get stake ratio (SODA to xSODA conversion rate)
- [`useInstantUnstakeRatio()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useInstantUnstakeRatio.ts) - Get instant unstake ratio (xSODA to SODA conversion rate with penalty)
- [`useConvertedAssets()`](https://github.com/icon-project/sodax-frontend/tree/main/packages/dapp-kit/src/hooks/staking/useConvertedAssets.ts) - Get converted assets amount for xSODA shares

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

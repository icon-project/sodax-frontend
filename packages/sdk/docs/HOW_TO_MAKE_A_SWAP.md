# How to Make a Swap

This guide provides a step-by-step walkthrough for executing a cross-chain swap using the Sodax SDK. It covers everything from initializing the SDK to handling errors during the swap process.

For detailed API reference, see [SWAPS.md](./SWAPS.md).

**Example Source Code**: A complete working example can be found in [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts). This example demonstrates a full swap implementation from Arbitrum ETH to Polygon POL, including all error handling and status polling.

## Prerequisites

Before you begin, ensure you have:

- A wallet provider implementation (e.g., `IEvmWalletProvider` for EVM chains). You can use existing wallet provider implementations from the [`@sodax/wallet-sdk-core`](https://www.npmjs.com/package/@sodax/wallet-sdk-core) npm package, or use the local package [@wallet-sdk-core](../../wallet-sdk-core/README.md) if working within the Sodax monorepo.
- The `@sodax/sdk` package installed
- Sufficient token balance to cover the swap amount and fees
- RPC URLs for the chains you're interacting with (we recommend having dedicate node provider like Alchemy, Quicknode, etc..)
- Private key or wallet (browser) connection for signing transactions. For React applications, you can use the [`@sodax/wallet-sdk-react`](https://www.npmjs.com/package/@sodax/wallet-sdk-react) npm package, or use the local package [@wallet-sdk-react](../../wallet-sdk-react/README.md) if working within the Sodax monorepo.

## Step 1: Initialize Sodax Instance

First, create and initialize a Sodax instance. The Sodax constructor defaults to mainnet configuration, so no configuration is required for basic usage.

```typescript
import { Sodax } from "@sodax/sdk";

// Create Sodax instance (defaults to mainnet configs)
const sodax = new Sodax();

// Initialize to fetch latest configuration from the backend API (optional, use version based approach without initialize for more stability)
// Initialization fetches the latest configuration from the backend API, including supported tokens and chains.
// This ensures you have the most up-to-date token and chain information
await sodax.initialize();
```

**Note**:

- The `new Sodax()` constructor defaults to mainnet configuration automatically. No configuration is required for basic usage.
- If you skip `initialize()`, the SDK will use the configuration from the specific SDK version you're using. Initialization is recommended for production applications to ensure you have the latest supported tokens and chains.

### Optional: Custom Configuration

If you need to use custom solver configuration or hub provider settings, you can pass them when creating the Sodax instance:

```typescript
import { Sodax, getSolverConfig, getHubChainConfig, SONIC_MAINNET_CHAIN_ID } from "@sodax/sdk";

const sodax = new Sodax({
  swap: getSolverConfig(SONIC_MAINNET_CHAIN_ID), // Custom solver config
  hubProviderConfig: {
    hubRpcUrl: 'https://rpc.soniclabs.com',
    chainConfig: getHubChainConfig(),
  },
});

await sodax.initialize();
```

## Step 2: Create Spoke Provider

A spoke provider is required to interact with the source chain where your tokens are located. You need to create a spoke provider for the chain you're swapping from.

**Note**: For node.js environments, we suggest you provide RPC URLs when creating wallet providers (default public ones might not work). For browser environments, wallet providers are typically injected by wallet extensions.

For EVM chains (Arbitrum, Polygon, BSC, etc.):

```typescript
import {
  EvmSpokeProvider,
  ARBITRUM_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type IEvmWalletProvider,
  type Hex
} from "@sodax/sdk";
import { EvmWalletProvider } from "@sodax/wallet-sdk-core";

const evmWalletProvider = new EvmWalletProvider({
  privateKey: '0x...' as Hex, // Your private key
  chainId: ARBITRUM_MAINNET_CHAIN_ID,
  rpcUrl: 'https://arb1.arbitrum.io/rpc', // Arbitrum RPC URL
});

// For browser: Use injected wallet provider from wallet extension
// const evmWalletProvider: IEvmWalletProvider = /* injected by wallet */;

// Create Arbitrum spoke provider
const arbSpokeProvider = new EvmSpokeProvider(
  evmWalletProvider,
  spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID]
);
```

**Important**: For Sonic chain, use `SonicSpokeProvider` instead of `EvmSpokeProvider`, even though it's an EVM chain. This is because Sonic is the hub chain and requires special handling.

For more details on creating spoke providers for different chain types, refer to the [README.md](../README.md#initialising-spoke-provider) section or see the [HOW_TO_CREATE_A_SPOKE_PROVIDER.md](./HOW_TO_CREATE_A_SPOKE_PROVIDER.md) guide.

**Example**: See how the Arbitrum spoke provider is created in the example file: [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts#L28-L44).

### Getting Supported Tokens

Before creating a swap, you may want to check which tokens are supported for swaps on each chain:

```typescript
// Get all supported swap tokens for a specific chain
const supportedTokens = sodax.swaps.getSupportedSwapTokensByChainId(ARBITRUM_MAINNET_CHAIN_ID);
console.log('Supported tokens on Arbitrum:', supportedTokens);

// Get all supported swap tokens across all chains
const allSupportedTokens = sodax.swaps.getSupportedSwapTokens();
console.log('All supported tokens:', allSupportedTokens);

// Each token object contains address, decimals, symbol, etc.
supportedTokens.forEach(token => {
  console.log(`Token: ${token.symbol}, Address: ${token.address}, Decimals: ${token.decimals}`);
});
```

## Step 3: Get a Quote (Optional but Recommended)

Before executing a swap, it's good practice to get a quote to show users the expected output amount. This helps set proper expectations and allows you to calculate slippage tolerance.

**Example**: See how quotes are obtained in the example file: [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts#L62-L80).

```typescript
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type SolverIntentQuoteRequest
} from "@sodax/sdk";

// Get native token addresses from chain configuration
const arbEthToken = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken; // ETH on Arbitrum
const polygonPolToken = spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].nativeToken; // POL on Polygon

// Amount to swap - IMPORTANT: Amount must be in the token's smallest unit
// For example, ETH has 18 decimals, so 0.0001 ETH = 100000000000000n (0.0001 * 10^18)
// You can get token decimals from the supported tokens list or token metadata
const inputAmount = 100000000000000n; // 0.0001 ETH (18 decimals)

const quoteRequest = {
  token_src: arbEthToken,
  token_dst: polygonPolToken,
  token_src_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
  token_dst_blockchain_id: POLYGON_MAINNET_CHAIN_ID,
  amount: inputAmount,
  quote_type: 'exact_input', // or 'exact_output'
} satisfies SolverIntentQuoteRequest;

const quoteResult = await sodax.swaps.getQuote(quoteRequest);

if (!quoteResult.ok) {
  console.error('Failed to get quote:', quoteResult.error);
  // Handle error - could be no path found, invalid tokens, etc.
} else {
  const { quoted_amount } = quoteResult.value;
  console.log('Quoted output amount:', quoted_amount);
  // Use quoted_amount to set minOutputAmount in your intent params
}
```

## Step 4: Check Token Allowance

Before creating a swap intent, you need to check if the Asset Manager contract has permission to spend your tokens. If not, you'll need to approve it first.

**Example**: See how allowance checking is implemented in the example file: [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts#L82-L112).

```typescript
import type { CreateIntentParams } from "@sodax/sdk";

// Prepare intent parameters (we'll complete this in Step 6)
const createIntentParams: CreateIntentParams = {
  inputToken: arbEthToken,
  outputToken: polygonPolToken,
  inputAmount: inputAmount,
  minOutputAmount: 900000n, // Minimum output you're willing to accept
  deadline: 0n, // 0 = no deadline, or use sodax.swaps.getSwapDeadline() for a deadline
  allowPartialFill: false,
  srcChain: ARBITRUM_MAINNET_CHAIN_ID,
  dstChain: POLYGON_MAINNET_CHAIN_ID,
  srcAddress: await evmWalletProvider.getWalletAddress(),
  dstAddress: await evmWalletProvider.getWalletAddress(), // Destination address
  solver: '0x0000000000000000000000000000000000000000', // address(0) = any solver
  data: '0x',
};

// Check if approval is needed
const allowanceResult = await sodax.swaps.isAllowanceValid({
  intentParams: createIntentParams,
  spokeProvider: arbSpokeProvider,
});

if (!allowanceResult.ok) {
  console.error('Failed to check allowance:', allowanceResult.error);
  // Handle error - could be network issue, invalid token, etc.
} else if (!allowanceResult.value) {
  console.log('Approval required. Proceeding to Step 5...');
  // Approval is needed, proceed to Step 5
} else {
  console.log('Allowance is sufficient. Proceeding to Step 6...');
  // Allowance is sufficient, skip to Step 6
}
```

## Step 5: Approve Tokens (If Needed)

If the allowance check returned `false`, you need to approve the Asset Manager contract to spend your tokens. The approval amount should match the `inputAmount` in your intent parameters (fees are automatically deducted from this amount).

**Example**: See how token approval is handled in the example file: [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts#L114-L135).

```typescript
if (!allowanceResult.value) {
  console.log('Approving tokens...');
  
  const approveResult = await sodax.swaps.approve({
    intentParams: createIntentParams,
    spokeProvider: arbSpokeProvider,
  });

  if (!approveResult.ok) {
    console.error('Failed to approve tokens:', approveResult.error);
    // Handle error - could be user rejection, network issue, insufficient gas, etc.
    return; // Stop execution if approval fails
  }

  const approvalTxHash = approveResult.value;
  console.log('Approval transaction hash:', approvalTxHash);

  // IMPORTANT: Wait for the approval transaction to be confirmed before proceeding
  // The exact method depends on your wallet provider implementation
  // Example for EVM:
  await arbSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash);
  console.log('Approval confirmed. Proceeding with swap...');
}
```

**Important**: Always wait for the approval transaction to be confirmed before proceeding with the swap. The exact method to wait for confirmation depends on your wallet provider implementation.

## Step 6: Prepare Intent Parameters

Now that you have approval (if needed), prepare the complete intent parameters. Make sure to:

- Use the quoted amount from Step 3 to set a reasonable `minOutputAmount`
- Set appropriate `deadline` (or use `0n` for no deadline)
- Ensure `srcAddress` matches your wallet address
- Set `dstAddress` to where you want to receive the output tokens

```typescript
// Get wallet address
const walletAddress = await evmWalletProvider.getWalletAddress();

// Optionally get a deadline (5 minutes from now by default)
const deadline = await sodax.swaps.getSwapDeadline(); // or use 0n for no deadline

// Prepare complete intent parameters
const createIntentParams: CreateIntentParams = {
  inputToken: arbEthToken,
  outputToken: polygonPolToken,
  inputAmount: inputAmount, // Amount you want to swap
  minOutputAmount: 900000n, // Minimum output (should be based on quote from Step 3)
  deadline: deadline, // or 0n for no deadline
  allowPartialFill: false, // Set to true if you want to allow partial fills
  srcChain: ARBITRUM_MAINNET_CHAIN_ID,
  dstChain: POLYGON_MAINNET_CHAIN_ID,
  srcAddress: walletAddress, // Must match your wallet address
  dstAddress: walletAddress, // Where to receive output tokens
  solver: '0x0000000000000000000000000000000000000000', // address(0) = any solver
  data: '0x', // Additional arbitrary data
};
```

## Step 7: Execute the Swap

Now you're ready to execute the swap. The `swap` method handles all steps automatically:

**Example**: See how the swap is executed in the example file: [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts#L137-L183).

1. Creates intent deposit transaction on the source chain
2. Submits transaction hash to the relayer API
3. Waits for the relayer to relay the transaction to the hub chain
4. Posts the hub chain transaction hash to the Solver API

```typescript
const swapResult = await sodax.swaps.swap({
  intentParams: createIntentParams,
  spokeProvider: arbSpokeProvider,
  // Optional parameters:
  // fee: customFee, // Custom partner fee (uses configured fee if not provided)
  // timeout: 120000, // Timeout in milliseconds (default: 60 seconds)
  // skipSimulation: false, // Whether to skip transaction simulation (default: false)
});

if (!swapResult.ok) {
  // Handle error - see Step 8 for detailed error handling
  console.error('Swap failed:', swapResult.error);
} else {
  const [solverExecutionResponse, intent, intentDeliveryInfo] = swapResult.value;
  
  console.log('Swap successful!');
  console.log('Solver execution response:', solverExecutionResponse);
  console.log('Intent:', intent);
  console.log('Source transaction hash:', intentDeliveryInfo.srcTxHash);
  console.log('Destination transaction hash:', intentDeliveryInfo.dstTxHash);
  
  // You can use these to track the swap status
}
```

## Step 8: Check Intent Status

After a successful swap submission, you should continuously monitor the intent status until it reaches a terminal state. The status checking should poll every 5 seconds until the swap is completed, failed, or not found.

**Example**: See the complete status polling implementation in the example file: [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts#L189-L289).

```typescript
import type { SolverIntentStatusRequest, SolverIntentStatusCode } from "@sodax/sdk";

/**
 * Check and log the status of an intent with user-friendly messages
 * Polls every 5 seconds until a terminal state is reached (SOLVED, FAILED, or NOT_FOUND)
 * @param sodax - The Sodax instance
 * @param dstTxHash - The destination transaction hash (hub chain transaction hash)
 * @param maxAttempts - Maximum number of polling attempts (default: 60, which is 5 minutes)
 * @param intervalMs - Polling interval in milliseconds (default: 5000 = 5 seconds)
 */
async function checkIntentStatus(
  sodax: Sodax,
  dstTxHash: string,
  maxAttempts = 60,
  intervalMs = 5000,
): Promise<void> {
  const statusRequest: SolverIntentStatusRequest = {
    intent_tx_hash: dstTxHash as `0x${string}`,
  };

  let attempt = 0;
  let lastStatus: SolverIntentStatusCode | null = null;
  let notFoundCount = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const statusResult = await sodax.swaps.getStatus(statusRequest);

    if (!statusResult.ok) {
      console.error(`[Attempt ${attempt}] Failed to check intent status:`, statusResult.error);
      // Continue polling even on error, as it might be a temporary issue
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      continue;
    }

    const { status, fill_tx_hash } = statusResult.value;

    // Handle terminal states (SOLVED, FAILED)
    if (status === SolverIntentStatusCode.SOLVED) {
      console.log(`[Attempt ${attempt}] ✅ Status: Swap completed successfully!`);
      if (fill_tx_hash) {
        console.log(`Fill transaction hash: ${fill_tx_hash}`);
        console.log('Your tokens have been successfully swapped and delivered to the destination chain.');
      } else {
        console.log('Your swap has been completed successfully.');
      }
      return;
    }

    if (status === SolverIntentStatusCode.FAILED) {
      console.log(`[Attempt ${attempt}] ❌ Status: Swap failed`);
      console.log('The swap could not be completed. Please check the transaction details or contact support.');
      return;
    }

    // Handle NOT_FOUND - give it a few attempts before treating as terminal
    if (status === SolverIntentStatusCode.NOT_FOUND) {
      notFoundCount++;
      if (notFoundCount >= 3) {
        console.log(`[Attempt ${attempt}] Status: Intent not found after ${notFoundCount} attempts`);
        console.log('Intent not found in the solver system. Please check the transaction hash manually.');
        return;
      }
      // Continue checking for a few more attempts
      if (status !== lastStatus) {
        console.log(`[Attempt ${attempt}] Status: Intent not found in the solver system`);
        console.log('This may happen if the intent was just created. Continuing to check...');
        lastStatus = status;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      continue;
    }

    // Handle non-terminal states (NOT_STARTED_YET, STARTED_NOT_FINISHED)
    // Only log status changes to avoid spam
    if (status !== lastStatus) {
      switch (status) {
        case SolverIntentStatusCode.NOT_STARTED_YET:
          console.log(`[Attempt ${attempt}] Status: Intent is queued and waiting to be processed`);
          console.log('Your swap is in the queue and will be processed soon.');
          break;

        case SolverIntentStatusCode.STARTED_NOT_FINISHED:
          console.log(`[Attempt ${attempt}] Status: Intent is being processed`);
          console.log('Your swap is currently being executed. Please wait for completion.');
          break;

        default:
          console.log(`[Attempt ${attempt}] Status: Unknown status (${status})`);
          console.log('Please check the swap status manually using the destination transaction hash.');
          return; // Unknown status - exit to avoid infinite loop
      }
      lastStatus = status;
    } else {
      // Status hasn't changed, show progress indicator
      console.log(`[Attempt ${attempt}] Still processing... (status: ${status})`);
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  // Max attempts reached
  console.log(`\n⚠️  Status polling reached maximum attempts (${maxAttempts}).`);
  console.log(`Last known status: ${lastStatus ?? 'unknown'}`);
  console.log('Please check the swap status manually using the destination transaction hash.');
  console.log(`Destination transaction hash: ${dstTxHash}`);
}

// After successful swap, start polling for status
await checkIntentStatus(sodax, intentDeliveryInfo.dstTxHash);
```

**Status Codes**:

- `NOT_FOUND (-1)`: Intent not found in the solver system (may appear immediately after creation). After 3 consecutive attempts, polling stops.
- `NOT_STARTED_YET (1)`: Intent is queued and waiting to be processed (continues polling)
- `STARTED_NOT_FINISHED (2)`: Intent is currently being processed (continues polling)
- `SOLVED (3)`: Swap completed successfully (includes `fill_tx_hash` when available) - **Terminal state, polling stops**
- `FAILED (4)`: Swap failed to complete - **Terminal state, polling stops**

**Polling Behavior**:

- Polls every 5 seconds (configurable via `intervalMs` parameter)
- Continues until a terminal state is reached (SOLVED, FAILED, or NOT_FOUND after 3 attempts)
- Maximum polling duration: 5 minutes (60 attempts × 5 seconds, configurable via `maxAttempts`)
- Shows progress messages with attempt numbers
- Logs status changes to avoid console spam
- Handles temporary API errors gracefully by continuing to poll

**Note**: The `fill_tx_hash` field is only present when the status is `SOLVED (3)`. This is the transaction hash of the fill transaction on the destination chain.

## Step 9: Handle Errors

The swap operation can fail at different stages. Use the provided error helper functions to handle each error type appropriately.

**Example**: See how different error types are handled in the example file: [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts#L144-L170).

```typescript
import {
  isIntentCreationFailedError,
  isIntentSubmitTxFailedError,
  isIntentPostExecutionFailedError,
  isWaitUntilIntentExecutedFailed,
  type IntentError
} from "@sodax/sdk";

if (!swapResult.ok) {
  const error = swapResult.error;
  
  if (isIntentCreationFailedError(error)) {
    // Intent creation failed on the source chain
    console.error('Intent creation failed');
    console.error('Payload:', error.data.payload);
    console.error('Original error:', error.data.error);
    
    // Common causes:
    //
    // - Insufficient token balance (including fee)
    // - Invalid token addresses
    // - Network issues on the source chain
    // - Invalid parameters (chain IDs, addresses, etc.)
    //
    // You may want to:
    // - Check user's token balance
    // - Verify token addresses and chain configurations
    // - Retry with different parameters
  } else if (isIntentSubmitTxFailedError(error)) {
    // Failed to submit transaction to the relay API
    console.error('Submit transaction failed');
    console.error('Payload:', error.data.payload);
    console.error('Original error:', error.data.error);
    
    // IMPORTANT: This is a critical event!
    // The transaction was created on-chain but failed to submit to the relay API.
    // You should:
    // - Retry the submission
    // - Store relevant payload information in localStorage or similar
    // - If the user leaves the session, their funds might get stuck until
    //   successful re-submission is made
    
    // You can manually retry submission:
    // const retryResult = await sodax.swaps.submitIntent({
    //   action: 'submit',
    //   params: {
    //     chain_id: getIntentRelayChainId(createIntentParams.srcChain).toString(),
    //     tx_hash: /* transaction hash from createIntent */,
    //   },
    // });
  } else if (isWaitUntilIntentExecutedFailed(error)) {
    // The intent was submitted but failed to execute on the hub chain
    console.error('Intent execution timeout');
    console.error('Payload:', error.data.payload);
    console.error('Original error:', error.data.error);
    
    // This could be due to:
    // - Timeout waiting for execution
    // - Hub chain congestion
    // - Intent execution failure on hub chain
    
    // You may want to:
    // - Check the intent status manually
    // - Retry with longer timeout
    // - Check hub chain status
  } else if (isIntentPostExecutionFailedError(error)) {
    // Failed to post execution data to the Solver API
    console.error('Post execution failed');
    console.error('Error data:', error.data);
    
    // The intent may have executed successfully, but the API call failed
    // You may want to:
    // - Check the intent status manually
    // - Verify the destination transaction hash
    // - Retry the post execution call
  } else {
    // Unknown error type
    console.error('Unknown error:', error);
    console.error('Error code:', error.code);
    console.error('Error data:', error.data);
  }
}
```

## Complete Example

Here's a complete end-to-end example combining all the steps. For a production-ready implementation, see the example source code in [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts):

```typescript
import {
  Sodax,
  EvmSpokeProvider,
  ARBITRUM_MAINNET_CHAIN_ID,
  POLYGON_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type CreateIntentParams,
  type SolverIntentQuoteRequest,
  type SolverIntentStatusRequest,
  SolverIntentStatusCode,
  isIntentCreationFailedError,
  isIntentSubmitTxFailedError,
  isIntentPostExecutionFailedError,
  isWaitUntilIntentExecutedFailed,
  type IEvmWalletProvider
} from "@sodax/sdk";

async function executeSwap(
  evmWalletProvider: IEvmWalletProvider,
  inputAmount: bigint
): Promise<void> {
  try {
    // Step 1: Initialize Sodax
    console.log('Step 1: Initializing Sodax...');
    const sodax = new Sodax();
    await sodax.initialize();
    console.log('Sodax initialized');

    // Step 2: Create Spoke Provider
    console.log('Step 2: Creating spoke provider...');
    const arbSpokeProvider = new EvmSpokeProvider(
      evmWalletProvider,
      spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID]
    );
    console.log('Spoke provider created');

    // Get native token addresses from chain configuration
    const arbEthToken = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID].nativeToken; // ETH on Arbitrum
    const polygonPolToken = spokeChainConfig[POLYGON_MAINNET_CHAIN_ID].nativeToken; // POL on Polygon

    // Step 3: Get Quote
    console.log('Step 3: Getting quote...');
    const quoteRequest: SolverIntentQuoteRequest = {
      token_src: arbEthToken,
      token_dst: polygonPolToken,
      token_src_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
      token_dst_blockchain_id: POLYGON_MAINNET_CHAIN_ID,
      amount: inputAmount,
      quote_type: 'exact_input',
    };

    const quoteResult = await sodax.swaps.getQuote(quoteRequest);
    if (!quoteResult.ok) {
      console.error('Failed to get quote:', quoteResult.error);
      return;
    }

    const quotedAmount = quoteResult.value.quoted_amount;
    console.log('Quoted amount:', quotedAmount);

    // Step 4: Check Allowance
    console.log('Step 4: Checking allowance...');
    const walletAddress = await evmWalletProvider.getWalletAddress();
    // Five minutes in seconds (300 seconds)
    const fiveMinutesInSeconds = 300n;
    const deadline = await sodax.swaps.getSwapDeadline(fiveMinutesInSeconds);

    const createIntentParams: CreateIntentParams = {
      inputToken: arbEthToken,
      outputToken: polygonPolToken,
      inputAmount: inputAmount,
      minOutputAmount: (quotedAmount * 95n) / 100n, // 5% slippage tolerance
      deadline: deadline,
      allowPartialFill: false,
      srcChain: ARBITRUM_MAINNET_CHAIN_ID,
      dstChain: POLYGON_MAINNET_CHAIN_ID,
      srcAddress: walletAddress,
      dstAddress: walletAddress,
      solver: '0x0000000000000000000000000000000000000000',
      data: '0x',
    };

    const allowanceResult = await sodax.swaps.isAllowanceValid({
      intentParams: createIntentParams,
      spokeProvider: arbSpokeProvider,
    });

    if (!allowanceResult.ok) {
      console.error('Failed to check allowance:', allowanceResult.error);
      return;
    }

    // Step 5: Approve if Needed
    if (!allowanceResult.value) {
      console.log('Step 5: Approving tokens...');
      const approveResult = await sodax.swaps.approve({
        intentParams: createIntentParams,
        spokeProvider: arbSpokeProvider,
      });

      if (!approveResult.ok) {
        console.error('Failed to approve tokens:', approveResult.error);
        return;
      }

      const approvalTxHash = approveResult.value;
      console.log('Approval transaction hash:', approvalTxHash);

      // Wait for approval confirmation
      await arbSpokeProvider.walletProvider.waitForTransactionReceipt(approvalTxHash);
      console.log('Approval confirmed');
    } else {
      console.log('Step 5: Approval not needed');
    }

    // Step 6: Execute Swap
    console.log('Step 6: Executing swap...');
    const swapResult = await sodax.swaps.swap({
      intentParams: createIntentParams,
      spokeProvider: arbSpokeProvider,
    });

    // Step 7: Handle Swap Result
    if (!swapResult.ok) {
      console.error('Step 7: Swap failed');
      const error = swapResult.error;

      if (isIntentCreationFailedError(error)) {
        console.error('Intent creation failed');
        console.error('Payload:', error.data.payload);
        console.error('Original error:', error.data.error);
      } else if (isIntentSubmitTxFailedError(error)) {
        console.error('Submit transaction failed');
        console.error('Payload:', error.data.payload);
        console.error('Original error:', error.data.error);
        console.error('CRITICAL: Transaction created but not submitted to relay. Retry submission!');
      } else if (isWaitUntilIntentExecutedFailed(error)) {
        console.error('Intent execution timeout');
        console.error('Payload:', error.data.payload);
        console.error('Original error:', error.data.error);
      } else if (isIntentPostExecutionFailedError(error)) {
        console.error('Post execution failed');
        console.error('Error data:', error.data);
      } else {
        console.error('Unknown error:', error);
      }
      return;
    }

    // Success!
    const [solverExecutionResponse, intent, intentDeliveryInfo] = swapResult.value;
    console.log('Step 7: Swap transaction submitted successfully!');
    console.log('Solver execution response:', solverExecutionResponse);
    console.log('Intent:', intent);
    console.log('Source transaction hash:', intentDeliveryInfo.srcTxHash);
    console.log('Destination transaction hash:', intentDeliveryInfo.dstTxHash);

    // Step 8: Check Intent Status (with continuous polling)
    console.log('Step 8: Checking intent status...');
    await checkIntentStatus(sodax, intentDeliveryInfo.dstTxHash);
  } catch (error) {
    console.error('Unexpected error during swap:', error);
  }
}

/**
 * Check and log the status of an intent with user-friendly messages
 * Polls every 5 seconds until a terminal state is reached (SOLVED, FAILED, or NOT_FOUND)
 */
async function checkIntentStatus(
  sodax: Sodax,
  dstTxHash: string,
  maxAttempts = 60,
  intervalMs = 5000,
): Promise<void> {
  const statusRequest: SolverIntentStatusRequest = {
    intent_tx_hash: dstTxHash as `0x${string}`,
  };

  let attempt = 0;
  let lastStatus: SolverIntentStatusCode | null = null;
  let notFoundCount = 0;

  while (attempt < maxAttempts) {
    attempt++;
    const statusResult = await sodax.swaps.getStatus(statusRequest);

    if (!statusResult.ok) {
      console.error(`[Attempt ${attempt}] Failed to check intent status:`, statusResult.error);
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      continue;
    }

    const { status, fill_tx_hash } = statusResult.value;

    if (status === SolverIntentStatusCode.SOLVED) {
      console.log(`[Attempt ${attempt}] ✅ Status: Swap completed successfully!`);
      if (fill_tx_hash) {
        console.log(`Fill transaction hash: ${fill_tx_hash}`);
        console.log('Your tokens have been successfully swapped and delivered to the destination chain.');
      }
      return;
    }

    if (status === SolverIntentStatusCode.FAILED) {
      console.log(`[Attempt ${attempt}] ❌ Status: Swap failed`);
      console.log('The swap could not be completed. Please check the transaction details or contact support.');
      return;
    }

    if (status === SolverIntentStatusCode.NOT_FOUND) {
      notFoundCount++;
      if (notFoundCount >= 3) {
        console.log(`[Attempt ${attempt}] Status: Intent not found after ${notFoundCount} attempts`);
        console.log('Intent not found in the solver system. Please check the transaction hash manually.');
        return;
      }
      if (status !== lastStatus) {
        console.log(`[Attempt ${attempt}] Status: Intent not found in the solver system`);
        console.log('This may happen if the intent was just created. Continuing to check...');
        lastStatus = status;
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      continue;
    }

    if (status !== lastStatus) {
      switch (status) {
        case SolverIntentStatusCode.NOT_STARTED_YET:
          console.log(`[Attempt ${attempt}] Status: Intent is queued and waiting to be processed`);
          console.log('Your swap is in the queue and will be processed soon.');
          break;
        case SolverIntentStatusCode.STARTED_NOT_FINISHED:
          console.log(`[Attempt ${attempt}] Status: Intent is being processed`);
          console.log('Your swap is currently being executed. Please wait for completion.');
          break;
        default:
          console.log(`[Attempt ${attempt}] Status: Unknown status (${status})`);
          return;
      }
      lastStatus = status;
    } else {
      console.log(`[Attempt ${attempt}] Still processing... (status: ${status})`);
    }

    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  console.log(`\n⚠️  Status polling reached maximum attempts (${maxAttempts}).`);
  console.log(`Last known status: ${lastStatus ?? 'unknown'}`);
  console.log('Please check the swap status manually using the destination transaction hash.');
  console.log(`Destination transaction hash: ${dstTxHash}`);
}

// Usage
await executeSwap(evmWalletProvider, 100000000000000n); // 0.0001 ETH
```

## Next Steps

- **See the complete example**: Check out the working implementation in [`apps/node/src/swap.ts`](../../../apps/node/src/swap.ts) for a production-ready swap example
- Learn more about swap configuration and advanced features in [SWAPS.md](./SWAPS.md)
- Learn how to create spoke providers in [HOW_TO_CREATE_A_SPOKE_PROVIDER.md](./HOW_TO_CREATE_A_SPOKE_PROVIDER.md)
- Explore other SDK features like [Money Market](./MONEY_MARKET.md), [Bridge](./BRIDGE.md), and [Staking](./STAKING.md)
- Check the [README.md](../README.md) for general SDK usage and configuration

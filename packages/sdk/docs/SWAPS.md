# Swaps (Solver)

Swaps part of the SDK provides abstractions to assist you with interacting with the cross-chain Intent Smart Contracts, Solver and Relay API.

All swap operations are accessed through the `swaps` property of a `Sodax` instance:

```typescript
import { Sodax, SpokeChainId, Token } from "@sodax/sdk";

const sodax = new Sodax();

// All swap methods are available through sodax.swap
const quote = await sodax.swaps.getQuote(quoteRequest);
```

## Using SDK Config and Constants

SDK includes predefined configurations of supported chains, tokens and other relevant information for the client to consume.
All of the configurations are reachable through `config` property of Sodax instance (e.g. `sodax.config`)

```typescript
import { SpokeChainId, Token, Sodax } from "@sodax/sdk";

const sodax = new Sodax();

// if you want dynamic (backend API based - contains latest tokens) configuration make sure to initialize instance before usage!
// by default configuration from specific SDK version you are using is used
await sodax.initialize();

// all supported spoke chains
const spokeChains: SpokeChainId[] = sodax.config.getSupportedSpokeChains();

// using spoke chain id to retrieve supported tokens for swap (solver intent swaps)
// NOTE: empty array indicates no tokens are supported, you should filter out empty arrays
const supportedSwapTokensForChainId: readonly Token[] = sodax.swaps.getSupportedSwapTokensByChainId(spokeChainId);

// object containing all supported swap tokens per chain ID
const supportedSwapTokensPerChain: Record<SpokeChainId, readonly Token[]> = sodax.swaps.getSupportedSwapTokens();

// check if token address for given spoke chain id is supported in swaps
const isSwapSupportedToken: boolean = isSwapSupportedToken(spokeChainId, token)
```

Please refer to [SDK constants.ts](https://github.com/icon-project/sodax-frontend/blob/main/packages/types/src/constants/index.ts) for more.

## Available Methods

All swap methods are accessible through `sodax.swaps`:

### Quote & Fee Methods

- `getQuote(request)` - Request a quote from the solver API
- `getPartnerFee(inputAmount)` - Calculate partner fee for a given input amount
- `getSolverFee(inputAmount)` - Calculate solver fee (0.1%) for a given input amount
- `getSwapDeadline(offset?)` - Get deadline timestamp for a swap

### Intent Creation & Execution

- `swap(params)` - Complete swap operation (recommended, handles all steps automatically)
- `createLimitOrder(params)` - Create a limit order intent (no deadline, must be cancelled manually)
- `createAndSubmitIntent(params)` - Create and submit intent (alternative to swap)
- `createIntent(params)` - Create intent only (for custom handling)
- `submitIntent(payload)` - Submit intent to relay API (for custom handling)
- `postExecution(request)` - Post execution to Solver API(for custom handling)

### Intent Management

- `getIntent(txHash)` - Retrieve intent from hub chain transaction hash
- `getFilledIntent(txHash)` - Get the filled intent state from the hub chain transaction hash by parsing the `IntentFilled` event.
  Useful for obtaining the final exact output amount and state details after an intent has been executed.
- `getSolvedIntentPacket(params)` - Get the intent delivery info about solved intent from the Relayer API.
- `getIntentHash(intent)` - Get keccak256 hash of an intent
- `getStatus(request)` - Get intent status from Solver API
- `cancelIntent(intent, spokeProvider, raw?)` - Cancel an active intent
- `cancelLimitOrder(intent, spokeProvider, raw?)` - Cancel a limit order intent (wrapper around cancelIntent)

### Token Approval

- `isAllowanceValid(params)` - Check if token approval is needed
- `approve(params, raw?)` - Approve tokens or request trustline (Stellar)

### Utility Methods

- `getSupportedSwapTokensByChainId(chainId)` - Get supported swap tokens for a chain
- `getSupportedSwapTokens()` - Get all supported swap tokens per chain
- `SwapService.estimateGas(rawTx, spokeProvider)` - Estimate gas for raw transactions (static method)

### Initialising Spoke Provider

Refer to [Initialising Spoke Provider](../README.md#initialising-spoke-provider) section to see how BSC spoke provider used as `bscSpokeProvider` can be created.

### Request a Quote

Requesting a quote should require you to just consume user input amount and converting it to the appropriate token amount (scaled by token decimals).
All the required configurations (chain id [nid], token decimals and address) should be loaded as described in [Using SDK Config and Constants](#using-sdk-config-and-constants).

Quoting API supports different types of quotes:

- "exact_input": "amount" parameter is the amount the user want's to swap (e.g. the user is asking for a quote to swap 1 WETH to xxx SUI)
- "exact_output": "amount" parameter is the final amount the user wants. (e.g. the user want's to swap WETH for SUI, but is asking how many WETH is going to cost to have 1 SUI)

```typescript
import {
  Sodax,
  BSC_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  type SolverIntentQuoteRequest,
  type SolverErrorResponse
} from "@sodax/sdk";

const sodax = new Sodax();

const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';  // Address of the ETH token on BSC (spoke chain)
const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'; // Address of the wBTC token on ARB (spoke chain)

const quoteRequest = {
  token_src: bscEthToken,
  token_dst: arbWbtcToken,
  token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
  token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
  amount: 1000000000000000n, // 1 WETH (18 decimals)
  quote_type: 'exact_input',
} satisfies SolverIntentQuoteRequest;

const result = await sodax.swaps.getQuote(quoteRequest);

if (result.ok) {
  const { quoted_amount } = result.value;
  console.log('Quoted amount:', quoted_amount);
} else {
  // handle error
  console.error('Quote failed:', result.error);
}
```

### Create Intent Params

```typescript
const createIntentParams = {
  inputToken: '0x..',  // The address of the input token on spoke chain
  outputToken: '0x..',  // The address of the output token on spoke chain
  inputAmount: BigInt(1000000), // The amount of input tokens (fee will be deducted from this amount)
  minOutputAmount: BigInt(900000), // min amount you are expecting to receive
  deadline: BigInt(0), // Optional timestamp after which intent expires (0 = no deadline)
  allowPartialFill: false, // Whether the intent can be partially filled
  srcChain: BSC_MAINNET_CHAIN_ID, // Chain ID where input tokens originate
  dstChain: ARBITRUM_MAINNET_CHAIN_ID, // Chain ID where output tokens should be delivered
  srcAddress: '0x..', // Source address (original address on spoke chain)
  dstAddress: '0x..', // Destination address (original address on spoke chain)
  solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
  data: '0x', // Additional arbitrary data
} satisfies CreateIntentParams;
```

### Function Parameters Structure

All solver functions use object parameters for better readability and extensibility. The common parameter structure includes:

- **`intentParams`**: The `CreateIntentParams` object containing swap details
- **`spokeProvider`**: The spoke provider instance for the source chain. Can be a regular `SpokeProvider` (e.g., `EvmSpokeProvider`) or a raw spoke provider (e.g., `EvmRawSpokeProvider`) when you only have a wallet address. See [HOW_TO_CREATE_A_SPOKE_PROVIDER.md](./HOW_TO_CREATE_A_SPOKE_PROVIDER.md) for details on raw spoke providers.
- **`fee`**: (Optional) Partner fee configuration. If not provided, uses the default partner fee from config. **Note**: Fees are now deducted from the input amount rather than added to it.
- **`raw`**: (Optional) Whether to return raw transaction data instead of executing the transaction. **Note**: When using raw spoke providers, you must pass `raw: true`. Some methods like `swap` and `createAndSubmitIntent` do not support raw mode as they need to execute transactions.
- **`timeout`**: (Optional) Timeout in milliseconds for relay operations (default: 60 seconds).
- **`skipSimulation`**: (Optional) Whether to skip transaction simulation (default: false).

**Raw Spoke Provider Support:**

- **Methods that support raw mode**: `createIntent`, `approve`, `cancelIntent`
- **Methods that do NOT support raw mode**: `swap`, `createAndSubmitIntent` (these methods need to execute transactions and submit them to the relay API)

### Get Fees

The swap service provides two fee calculation methods:

#### Get Partner Fee

The `getPartnerFee` function allows you to calculate the partner fee for a given input amount before creating an intent. This is useful for displaying fee information to users or calculating the total cost of a swap.

```typescript
// Calculate partner fee for a given input amount
const inputAmount = 1000000000000000n; // 1 WETH (18 decimals)
const partnerFee = sodax.swaps.getPartnerFee(inputAmount);

console.log('Partner fee amount:', partnerFee); // Fee in input token units
console.log('Partner fee percentage:', Number(partnerFee) / Number(inputAmount) * 100); // Fee as percentage
console.log('Amount after fee deduction:', inputAmount - partnerFee); // Actual amount used for swap
```

**Note**: If no partner fee is configured, the function returns `0n`. The fee is deducted from the input amount, so the actual amount used for the swap will be `inputAmount - partnerFee`.

#### Get Solver Fee

The `getSolverFee` function calculates the solver fee (0.1% fee) for a given input amount. This is the standard fee charged by the solver service.

```typescript
// Calculate solver fee for a given input amount
const inputAmount = 1000000000000000n; // 1 WETH (18 decimals)
const solverFee = sodax.swaps.getSolverFee(inputAmount);

console.log('Solver fee amount:', solverFee); // Fee in input token units (0.1% of inputAmount)
console.log('Solver fee percentage:', Number(solverFee) / Number(inputAmount) * 100); // Should be 0.1%
```

### Get Swap Deadline

The `getSwapDeadline` function allows you to calculate a deadline timestamp for your swap by querying the hub chain's current block timestamp and adding a deadline offset. This is useful for setting expiration times for intents to prevent them from being executed after a certain period.

```typescript
// Get deadline with default 5-minute offset (300 seconds)
const deadline = await sodax.swaps.getSwapDeadline();
console.log('Swap deadline (5 min from now):', deadline);

// Get deadline with custom offset (e.g., 10 minutes)
const customDeadline = await sodax.swaps.getSwapDeadline(600n); // 600 seconds = 10 minutes
console.log('Swap deadline (10 min from now):', customDeadline);

// Use the deadline in your intent parameters
const createIntentParams = {
  // ... other parameters ...
  deadline: deadline, // Set the calculated deadline
  // ... other parameters ...
};
```

**Note**: The deadline is calculated as `hub_chain_block_timestamp + deadline_offset`. The default offset is 5 minutes (300 seconds), but you can customize this value based on your requirements. Setting a deadline helps prevent intents from being executed if market conditions change significantly.

### Token Approval Flow

Before creating an intent, you need to ensure that the Asset Manager contract has permission to spend your tokens. Here's how to handle the approval flow:

```typescript
import {
  BSC_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID
} from "@sodax/sdk";

const evmWalletAddress = await evmWalletProvider.getWalletAddress();

// First check if approval is needed
const isApproved = await sodax.swaps.isAllowanceValid({
  intentParams: createIntentParams,
  spokeProvider: bscSpokeProvider,
});

if (!isApproved.ok) {
  // Handle error
  console.error('Failed to check allowance:', isApproved.error);
} else if (!isApproved.value) {
  // Approve Sodax to transfer your tokens
  const approveResult = await sodax.swaps.approve({
    intentParams: createIntentParams,
    spokeProvider: bscSpokeProvider,
  });

  if (!approveResult.ok) {
    // Handle error
    console.error('Failed to approve tokens:', approveResult.error);
  } else {
    // Wait for tx hash from approveResult.value to be mined before proceeding
    const txHash = approveResult.value;
    console.log('Approval transaction:', txHash);
  }
}

// Now you can proceed with creating the intent
// ... continue with createIntent or swap ...
```

**Using Raw Spoke Providers with `approve`:**

When using raw spoke providers, you can get raw approval transaction data:

```typescript
import {
  EvmRawSpokeProvider,
  BSC_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type Address
} from "@sodax/sdk";

// User's wallet address
const userWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address;

// Create raw spoke provider
const bscChainConfig = spokeChainConfig[BSC_MAINNET_CHAIN_ID];
const bscRawSpokeProvider = new EvmRawSpokeProvider(userWalletAddress, bscChainConfig);

// Get raw approval transaction
const approveResult = await sodax.swaps.approve({
  intentParams: {
    ...createIntentParams,
    srcAddress: userWalletAddress,
  },
  spokeProvider: bscRawSpokeProvider,
  raw: true, // Required when using raw spoke provider
});

if (approveResult.ok) {
  const rawTx = approveResult.value;
  // rawTx is a raw transaction object: { from, to, value, data }
  // This can be sent to the user for signing
  console.log('Raw approval transaction:', rawTx);
}
```

**Important**: The approval amount is now the same as the `inputAmount` specified in your intent parameters. The fee is automatically deducted from this amount during intent creation, so you only need to approve the exact amount you want to swap.

### Stellar Trustline Requirements

For Stellar-based swap operations, the allowance and approval system works differently:

- **Source Chain (Stellar)**: The standard `isAllowanceValid` and `approve` methods work as expected for EVM chains, but for Stellar as the source chain, these methods check and establish trustlines instead.

- **Destination Chain (Stellar)**: When Stellar is specified as the destination chain, frontends/clients need to manually establish trustlines before executing swaps. See [Stellar Trustline Requirements](./STELLAR_TRUSTLINE.md#swaps) for detailed information and code examples.

### Estimate Gas for Raw Transactions

The `estimateGas` static method allows you to estimate the gas cost for raw transactions before executing them. This is particularly useful for intent creation and approval transactions to provide users with accurate gas estimates.

**Note**: This is a static method, so it can be called directly on `SwapService`. This method works with both regular and raw spoke providers.

```typescript
import {
  SwapService,
  EvmRawSpokeProvider,
  BSC_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type Address
} from "@sodax/sdk";

// Example: Estimate gas for an intent creation transaction using regular spoke provider
const createIntentResult = await sodax.swaps.createIntent({
  intentParams: createIntentParams,
  spokeProvider: bscSpokeProvider,
  fee, // optional - uses configured partner fee if not provided
  raw: true, // true = get raw transaction
});

if (createIntentResult.ok) {
  const [rawTx, intent] = createIntentResult.value;
  
  // Estimate gas for the raw transaction (static method)
  // Note: SwapService.estimateGas is a static method
  const gasEstimate = await SwapService.estimateGas(rawTx, bscSpokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas:', gasEstimate.error);
  }
}

// Example: Estimate gas using raw spoke provider (backend scenario)
const userWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address;
const bscChainConfig = spokeChainConfig[BSC_MAINNET_CHAIN_ID];
const bscRawSpokeProvider = new EvmRawSpokeProvider(userWalletAddress, bscChainConfig);

const createIntentResultWithRaw = await sodax.swaps.createIntent({
  intentParams: {
    ...createIntentParams,
    srcAddress: userWalletAddress,
    dstAddress: userWalletAddress,
  },
  spokeProvider: bscRawSpokeProvider,
  raw: true, // Required when using raw spoke provider
});

if (createIntentResultWithRaw.ok) {
  const [rawTx, intent] = createIntentResultWithRaw.value;
  
  // Estimate gas using the raw spoke provider
  const gasEstimate = await SwapService.estimateGas(rawTx, bscRawSpokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas:', gasEstimate.value);
  }
}

// Example: Estimate gas for an approval transaction
const approveResult = await sodax.swaps.approve({
  intentParams: createIntentParams,
  spokeProvider: bscSpokeProvider,
  raw: true // true = get raw transaction
});

if (approveResult.ok) {
  const rawTx = approveResult.value;
  
  // Estimate gas for the approval transaction (static method)
  const gasEstimate = await SwapService.estimateGas(rawTx, bscSpokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas for approval:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas for approval:', gasEstimate.error);
  }
}
```

### Create And Submit Intent Order (Swap)

Creating Intent Order requires creating spoke provider for the chain that intent is going to be created on (`srcChain`).

Example for BSC -> ARB Intent Order:

#### Swap (Recommended Method)

The `swap` method is the recommended way to perform a complete swap operation. It handles all the steps automatically:

1. Create intent deposit tx on spoke (source) chain
2. Submit tx hash to relayer API
3. Wait for relayer to relay tx data to the hub chain (Sonic)
4. Post hub chain tx hash to the Solver API

**Note**: The `swap` method does NOT support raw mode (`raw: true`) because it needs to execute transactions and submit them to the relay API. If you need raw transaction data, use `createIntent` instead.

```typescript
import {
  BSC_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID
} from "@sodax/sdk";

/**
 * Create swap which does all steps for you automatically
 * IMPORTANT: You should primarily use swap function unless you require custom step by step handling
 * NOTE: This method requires a regular spoke provider (not raw) as it needs to execute transactions
 */
const swapResult = await sodax.swaps.swap({
  intentParams: createIntentParams,
  spokeProvider: bscSpokeProvider,
  fee, // optional - uses configured partner fee if not provided
  timeout, // optional - timeout in milliseconds (default: 60 seconds)
  skipSimulation, // optional - whether to skip transaction simulation (default: false)
});

if (!swapResult.ok) {
  // handle error as described in Error Handling section
}

// solverExecutionResponse, created Intent data, and intent delivery info
const [solverExecutionResponse, intent, intentDeliveryInfo] = swapResult.value;
```

#### Create Limit Order

Limit orders are similar to regular swaps but have no deadline (deadline is automatically set to `0n`). They remain active until manually cancelled by the user. Limit orders are useful when you want to place an order that should remain open indefinitely until filled or cancelled.

**Key differences from regular swaps:**
- No deadline (automatically set to `0n`)
- Uses the same approval flow as regular swaps
- Must be cancelled manually using `cancelIntent`

```typescript
import type { CreateLimitOrderParams } from '@sodax/sdk';

// Create limit order params (note: deadline is omitted, it will be set to 0n automatically)
const limitOrderParams = {
  inputToken: '0x..',  // The address of the input token on spoke chain
  outputToken: '0x..',  // The address of the output token on spoke chain
  inputAmount: BigInt(1000000), // The amount of input tokens
  minOutputAmount: BigInt(900000), // min amount you are expecting to receive
  // deadline is omitted - will be automatically set to 0n
  allowPartialFill: false, // Whether the intent can be partially filled
  srcChain: BSC_MAINNET_CHAIN_ID, // Chain ID where input tokens originate
  dstChain: ARBITRUM_MAINNET_CHAIN_ID, // Chain ID where output tokens should be delivered
  srcAddress: '0x..', // Source address (original address on spoke chain)
  dstAddress: '0x..', // Destination address (original address on spoke chain)
  solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
  data: '0x', // Additional arbitrary data
} satisfies CreateLimitOrderParams;

// Create the limit order
const createLimitOrderResult = await sodax.swaps.createLimitOrder({
  intentParams: limitOrderParams,
  spokeProvider: bscSpokeProvider,
  fee, // optional - uses configured partner fee if not provided
  timeout, // optional - timeout in milliseconds (default: 60 seconds)
});

if (!createLimitOrderResult.ok) {
  // handle error
}

const [solverExecutionResponse, intent, intentDeliveryInfo] = createLimitOrderResult.value;

// Get intent hash for tracking
const intentHash = sodax.swaps.getIntentHash(intent);
console.log('Limit order created with intent hash:', intentHash);
```

**Important Notes:**
- Limit orders use the same approval flow as regular swaps - use `isAllowanceValid` and `approve` methods
- Limit orders remain active indefinitely until cancelled or filled
- The fee is automatically deducted from the `inputAmount` just like regular swaps
- Limit orders go through the same flow as swaps (create, submit to relay, wait for execution, post to Solver API)

#### Cancel Limit Order

Cancel a limit order intent. This is a wrapper around `cancelIntent` since cancelling a limit order is the same as cancelling any intent.

**Note**: You can also use `cancelIntent` directly - both methods work identically. `cancelLimitOrder` is provided for semantic clarity when working with limit orders.

```typescript
import type { Intent } from "@sodax/sdk";

// Get intent first (or use intent from createLimitOrder response)
const intent: Intent = await sodax.swaps.getIntent(txHash);

// Cancel the limit order
const cancelResult = await sodax.swaps.cancelLimitOrder(
  intent,
  bscSpokeProvider,
);

if (cancelResult.ok) {
  console.log('[cancelLimitOrder] txHash:', cancelResult.value);
} else {
  // handle error
  console.error('[cancelLimitOrder] error:', cancelResult.error);
}
```

#### Create And Submit Intent (Alternative Method - Equal to Swap)

If you need more control over the process, you can use `createAndSubmitIntent` which is equivalent to `swap`:

**Note**: The `createAndSubmitIntent` method does NOT support raw mode (`raw: true`) because it needs to execute transactions and submit them to the relay API. If you need raw transaction data, use `createIntent` instead.

```typescript
const createAndSubmitIntentResult = await sodax.swaps.createAndSubmitIntent({
  intentParams: createIntentParams,
  spokeProvider: bscSpokeProvider,
  fee, // optional - uses configured partner fee if not provided
  timeout, // optional - timeout in milliseconds (default: 60 seconds)
  skipSimulation, // optional - whether to skip transaction simulation (default: false)
});

if (!createAndSubmitIntentResult.ok) {
  // handle error
}

const [solverExecutionResponse, intent, intentDeliveryInfo] = createAndSubmitIntentResult.value;
```

#### Create Intent Only

If you need to create an intent without automatically submitting it (for custom handling), use `createIntent`:

```typescript
// Creates intent on-chain transaction or returns raw transaction
// NOTE: After intent is created on-chain it should also be posted
// to Solver API and submitted to Relay API (see swap function on how it is done)
const createIntentResult = await sodax.swaps.createIntent({
  intentParams: createIntentParams,
  spokeProvider: bscSpokeProvider,
  fee, // optional - uses configured partner fee if not provided
  raw: true, // true = get raw transaction, false = execute and return tx hash
});

if (!createIntentResult.ok) {
  // handle error
}

// txHash/rawTx, Intent & FeeAmount, and create intent data (Hex)
const [rawTx, intent, intentDataHex] = createIntentResult.value;
```

**Using Raw Spoke Providers with `createIntent`:**

When using raw spoke providers (e.g., `EvmRawSpokeProvider`), you must pass `raw: true` to get raw transaction data:

```typescript
import {
  EvmRawSpokeProvider,
  ARBITRUM_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type Address
} from "@sodax/sdk";

// User's wallet address (e.g., from database or API)
const userWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address;

// Create raw spoke provider
const arbChainConfig = spokeChainConfig[ARBITRUM_MAINNET_CHAIN_ID];
const arbRawSpokeProvider = new EvmRawSpokeProvider(userWalletAddress, arbChainConfig);

// Create intent with raw spoke provider
const createIntentResult = await sodax.swaps.createIntent({
  intentParams: {
    ...createIntentParams,
    srcAddress: userWalletAddress,
    dstAddress: userWalletAddress,
  },
  spokeProvider: arbRawSpokeProvider,
  raw: true, // Required when using raw spoke provider
});

if (createIntentResult.ok) {
  const [rawTx, intent, intentDataHex] = createIntentResult.value;
  // rawTx is a raw transaction object: { from, to, value, data }
  // This can be sent to the user for signing or used for gas estimation
  console.log('Raw transaction:', rawTx);
}
```

**Important**: When creating an intent, the fee is automatically deducted from the `inputAmount` specified in your `createIntentParams`. The actual amount used for the swap will be `inputAmount - feeAmount`. Make sure your `inputAmount` is sufficient to cover both the swap amount and the fee.

### Submit Intent to Relay API

Submit the spoke chain transaction hash to the relay API for processing. This step is required after creating an intent on the spoke chain.

**Note**: This is typically handled automatically by the `swap` or `createAndSubmitIntent` methods. You only need to call this manually if you're using `createIntent` separately.

```typescript
import type { IntentRelayRequest } from "@sodax/sdk";

const submitPayload = {
  action: 'submit',
  params: {
    chain_id: '0x38.bsc', // Chain ID where the intent was created
    tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af', // Transaction hash from createIntent
  },
} satisfies IntentRelayRequest<'submit'>;

const submitResult = await sodax.swaps.submitIntent(submitPayload);

if (submitResult.ok) {
  const { success, message } = submitResult.value;
  console.log('[submitIntent] success:', success);
  console.log('[submitIntent] message:', message);
} else {
  // handle error
  console.error('[submitIntent] error:', submitResult.error);
}
```

### Post Execution to Solver API

Post execution of intent order transaction executed on hub chain to Solver API. This step is typically handled automatically by the `swap` or `createAndSubmitIntent` methods.

**Note**: This is usually called automatically after the intent is executed on the hub chain. You only need to call this manually if you're handling the flow step by step.

```typescript
import type { SolverExecutionRequest } from "@sodax/sdk";

const postExecutionRequest = {
  intent_tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af', // Hub chain transaction hash
} satisfies SolverExecutionRequest;

const postExecutionResult = await sodax.swaps.postExecution(postExecutionRequest);

if (postExecutionResult.ok) {
  const { answer, intent_hash } = postExecutionResult.value;
  console.log('[postExecution] answer:', answer);
  console.log('[postExecution] intent_hash:', intent_hash);
} else {
  // handle error
  console.error('[postExecution] error:', postExecutionResult.error);
}
```

### Get Intent Order

Retrieve intent data using transaction hash from the hub chain (destination transaction hash).

```typescript
// Get intent from hub chain transaction hash
// Note: Use the dst_tx_hash from intentDeliveryInfo or relay packet
const intent = await sodax.swaps.getIntent(txHash);
console.log('Intent:', intent);
```

### Get Filled Intent

Retrieve the intent state from a transaction hash on the hub chain. This method extracts the intent state from the `IntentFilled` event logs emitted when an intent is filled by a solver.

**Note**: The `txHash` should be the hub chain transaction hash where the intent was filled. This can be obtained from the solver execution response.

```typescript
import type { Hash, IntentState } from "@sodax/sdk";

// Get filled intent state from hub chain transaction hash
// This retrieves the intent state from IntentFilled event logs
const txHash: Hash = '0x...'; // Hub chain transaction hash where intent was filled

try {
  const intentState: IntentState = await sodax.swaps.getFilledIntent(txHash);
  
  console.log('Intent exists:', intentState.exists);
  console.log('Remaining input:', intentState.remainingInput);
  console.log('Received output:', intentState.receivedOutput);
  console.log('Pending payment:', intentState.pendingPayment);
} catch (error) {
  // Handle error - no filled intent found for the transaction hash
  console.error('Failed to get filled intent:', error);
}
```

**IntentState Structure:**

- `exists`: `boolean` - Whether the intent exists
- `remainingInput`: `bigint` - Remaining input amount that hasn't been filled
- `receivedOutput`: `bigint` - Amount of output tokens received
- `pendingPayment`: `boolean` - Whether there is a pending payment

**Note**: This method throws an error if no filled intent is found for the given transaction hash. Make sure the transaction hash corresponds to a transaction that contains an `IntentFilled` event.

### Cancel Intent Order

Active Intent Order can be cancelled using Intent. See [Get Intent Order](#get-intent-order) on how to obtain intent.

**Note**: Create intent functions also return intent data for convenience, so you can use the intent from the creation response.

```typescript
import type { Intent } from "@sodax/sdk";

// Get intent first (or use intent from createIntent/swap response)
const intent: Intent = await sodax.swaps.getIntent(txHash);

// Cancel the intent
const result = await sodax.swaps.cancelIntent(
  intent,
  bscSpokeProvider,
  false, // true = get raw transaction, false = execute and return tx hash
);

if (result.ok) {
  console.log('[cancelIntent] txHash:', result.value);
} else {
  // handle error
  console.error('[cancelIntent] error:', result.error);
}
```

**Using Raw Spoke Providers with `cancelIntent`:**

When using raw spoke providers, you can get raw cancel transaction data:

```typescript
import {
  EvmRawSpokeProvider,
  BSC_MAINNET_CHAIN_ID,
  spokeChainConfig,
  type Address,
  type Intent
} from "@sodax/sdk";

// User's wallet address
const userWalletAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address;

// Create raw spoke provider
const bscChainConfig = spokeChainConfig[BSC_MAINNET_CHAIN_ID];
const bscRawSpokeProvider = new EvmRawSpokeProvider(userWalletAddress, bscChainConfig);

// Get intent (or use from previous createIntent response)
const intent: Intent = await sodax.swaps.getIntent(txHash);

// Get raw cancel transaction
const result = await sodax.swaps.cancelIntent(
  intent,
  bscRawSpokeProvider,
  true, // true = get raw transaction
);

if (result.ok) {
  const rawTx = result.value;
  // rawTx is a raw transaction object: { from, to, value, data }
  // This can be sent to the user for signing
  console.log('Raw cancel transaction:', rawTx);
}
```

### Get Intent Status

Retrieve status of intent from the Solver API.

**Note**: The `intent_tx_hash` should be the destination transaction hash (hub chain transaction hash), which can be obtained from `intentDeliveryInfo.dstTxHash` or the relay packet `dst_tx_hash` property.

```typescript
import type { SolverIntentStatusRequest } from "@sodax/sdk";

const statusRequest = {
  intent_tx_hash: '0x...', // Hub chain transaction hash (dst_tx_hash from relay packet)
} satisfies SolverIntentStatusRequest;

const result = await sodax.swaps.getStatus(statusRequest);

if (result.ok) {
  const { status, intent_hash } = result.value;
  console.log('Intent status:', status);
  console.log('Intent hash:', intent_hash);
} else {
  // handle error
  console.error('Failed to get status:', result.error);
}
```

### Get Solved Intent Packet

Get the intent delivery info about solved intent from the Relayer API. Packet data contains info about the intent execution on the destination chain.

**Note**: This method should be called after `getStatus` returns a status of `SOLVED (3)`. The `fill_tx_hash` from the status response is used as the `fillTxHash` parameter.

```typescript
import {
  ARBITRUM_MAINNET_CHAIN_ID,
  SolverIntentStatusCode,
  type SolverIntentStatusRequest,
  type PacketData,
  type IntentError
} from "@sodax/sdk";

// First, get the status to check if the intent is solved
const statusRequest = {
  intent_tx_hash: '0x...', // Hub chain transaction hash
} satisfies SolverIntentStatusRequest;

const statusResult = await sodax.swaps.getStatus(statusRequest);

if (statusResult.ok && statusResult.value.status === SolverIntentStatusCode.SOLVED) {
  const { fill_tx_hash } = statusResult.value;
  
  if (fill_tx_hash) {
    // Get the packet data for the solved intent
    const packetResult = await sodax.swaps.getSolvedIntentPacket({
      chainId: ARBITRUM_MAINNET_CHAIN_ID, // Destination spoke chain ID
      fillTxHash: fill_tx_hash, // Fill transaction hash from getStatus
      timeout: 120000, // Optional: timeout in milliseconds (default: 120 seconds)
    });

    if (packetResult.ok) {
      const packet: PacketData = packetResult.value;
      console.log('Source chain ID:', packet.src_chain_id);
      console.log('Source transaction hash:', packet.src_tx_hash);
      console.log('Destination chain ID:', packet.dst_chain_id);
      console.log('Destination transaction hash:', packet.dst_tx_hash);
      console.log('Status:', packet.status);
      console.log('Source address:', packet.src_address);
      console.log('Destination address:', packet.dst_address);
    } else {
      // Handle timeout error
      const error: IntentError<'RELAY_TIMEOUT'> = packetResult.error;
      console.error('Failed to get solved intent packet:', error);
    }
  }
}
```

### Get Intent Hash

Get Intent Hash (keccak256) used as an ID of intent in smart contract.

```typescript
import type { Intent, Hex } from "@sodax/sdk";

// Get the keccak256 hash of an intent
// This hash serves as the intent ID on the hub chain
const intentHash: Hex = sodax.swaps.getIntentHash(intent);
console.log('Intent hash:', intentHash);
```

## Error Handling

Error handling for Solver operations is more complex due to the multi-step nature of cross-chain intent creation and execution. The SDK provides specific error types and helper functions to help you handle different failure scenarios appropriately.

### Error Types and Helper Functions

The SDK provides several helper functions to check error types:

```typescript
import {
  isIntentCreationFailedError,
  isIntentSubmitTxFailedError,
  isIntentPostExecutionFailedError,
  isWaitUntilIntentExecutedFailed,
  type IntentError,
  type IntentErrorCode
} from "@sodax/sdk";
```

### Handling `swap` (a.k.a. createAndSubmitIntent) Errors

The `swap` function performs multiple operations in sequence, and each step can fail. The returned error type can be checked using the helper functions:

```typescript
const swapResult = await sodax.swaps.swap({
  intentParams: createIntentParams,
  spokeProvider: bscSpokeProvider,
  fee, // optional - uses configured partner fee if not provided
  timeout, // optional - timeout in milliseconds (default: 60 seconds)
});

if (!swapResult.ok) {
  const error = swapResult.error;
  
  if (isIntentCreationFailedError(error)) {
    // Intent creation failed on the spoke chain, error is of type IntentError<'CREATION_FAILED'>
    // This could be due to:
    // - Insufficient token balance (including fee)
    // - Invalid token addresses
    // - Network issues on the spoke chain
    // - Invalid parameters (chain IDs, addresses, etc.)
    console.error('Intent creation failed:', error.data.payload);
    console.error('Original error:', error.data.error);
    
    // You may want to retry with different parameters or check user's balance
  } else if (isIntentSubmitTxFailedError(error)) {
    // Failed to submit the spoke chain transaction to the relay API, error is of type IntentError<'SUBMIT_TX_FAILED'>
    // IMPORTANT: This is a critical event and you should retry submit
    //  and store relevant payload   information in localstorage or
    // similar local permanent memory. If client leaves the session
    // in this critical moment his funds might get stuck until
    // successful re-submission is made.
    //
    // This could be due to:
    // - Relay API being down
    // - Invalid transaction hash
    // - Network connectivity issues
    console.error('Submit transaction failed:', error.data.payload);
    console.error('Original error:', error.data.error);
    
    // You may want to retry the submission or check relay API status
  } else if (isWaitUntilIntentExecutedFailed(error)) {
    // The intent was submitted but failed to execute on the hub chain, error is of type IntentError<'RELAY_TIMEOUT'>
    // This could be due to:
    // - Timeout waiting for execution
    // - Hub chain congestion
    // - Intent execution failure on hub chain
    console.error('Intent execution timeout:', error.data.payload);
    console.error('Original error:', error.data.error);
    
    // You may want to check the intent status or retry with longer timeout
  } else if (isIntentPostExecutionFailedError(error)) {
    // Failed to post execution data to the Solver API, error is of type IntentError<'POST_EXECUTION_FAILED'>
    // This could be due to:
    // - Solver API being down
    // - Invalid execution data
    // - Network issues
    console.error('Post execution failed:', error.data);
    
    // The intent may have executed successfully, but the API call failed
    // You may want to check the intent or packet status manually
  } else {
    // Unknown error type IntentError<'UNKNOWN'>
    console.error('Unknown error:', error);
  }
}
```

### Handling `createIntent` Errors

The `createIntent` function has a simpler error structure since it only handles intent creation on spoke chain (source chain):

```typescript
const createIntentResult = await sodax.swaps.createIntent({
  intentParams: createIntentParams,
  spokeProvider: bscSpokeProvider,
  fee, // optional - uses configured partner fee if not provided
  raw: false
});

if (!createIntentResult.ok) {
  const error = createIntentResult.error;

  // createIntent only returns IntentError<'CREATION_FAILED'>
  if (isIntentCreationFailedError(error)) {
    console.error('Intent creation failed:', error.data.payload);
    console.error('Original error:', error.data.error);

    // Common causes:
    // - Insufficient token balance (the inputAmount should cover both the swap amount and fee)
    // - Invalid token addresses or chain IDs
    // - Network issues on the spoke chain
    // - Invalid wallet address or permissions
    // - Contract interaction failures

    // You may want to:
    // - Check user's token balance (ensure it's >= inputAmount)
    // - Verify token addresses and chain configurations
    // - Retry with different parameters
  }
}
```

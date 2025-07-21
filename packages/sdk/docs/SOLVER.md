# Solver

Solver part of the SDK provides abstractions to assist you with interacting with the cross-chain Intent Smart Contracts, Solver and Relay API.

## Using SDK Config and Constants

SDK includes predefined configurations of supported chains, tokens and other relevant information for the client to consume.

```typescript
import { supportedSpokeChains, getSupportedSolverTokens, SpokeChainId, Token } from "@sodax/sdk"

// all supported spoke chains
export const spokeChains: SpokeChainId[] = supportedSpokeChains;

// using spoke chain id to retrieve supported tokens for solver (intent swaps)
const supportedSolverTokens: readonly Token[] = getSupportedSolverTokens(spokeChainId);

// check if token address for given spoke chain id is supported in solver
const isSolverSupportedToken: boolean = isSolverSupportedToken(spokeChainId, token)
```

Please refer to [SDK constants.ts](https://github.com/icon-project/sodax-frontend/blob/main/packages/sdk/src/constants.ts) for more.

### Initialising Spoke Provider

Refer to [Initialising Spoke Provider](../README.md#initialising-spoke-provider) section to see how BSC spoke provider used as `bscSpokeProvider` can be created.

### Request a Quote

Requesting a quote should require you to just consume user input amount and converting it to the appropriate token amount (scaled by token decimals).
All the required configurations (chain id [nid], token decimals and address) should be loaded as described in [Load SDK Config](#load-sdk-config).

Quoting API supports different types of quotes:
- "exact_input": "amount" parameter is the amount the user want's to swap (e.g. the user is asking for a quote to swap 1 WETH to xxx SUI)
- "exact_output": "amount" parameter is the final amount the user wants. (e.g. the user want's to swap WETH for SUI, but is asking how many WETH is going to cost to have 1 SUI)

```typescript
import {
  Sodax,
  getHubChainConfig,
  BSC_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID,
  SolverIntentQuoteRequest,
  Result,
  SolverIntentQuoteResponse,
  SolverErrorResponse
} from "@sodax/sdk";

const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';  // Address of the ETH token on BSC (spoke chain)
const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'; // Address of the wBTC token on ARB (spoke chain)

  const quoteRequest = {
    token_src: bscEthToken,
    token_dst: arbWbtcToken,
    token_src_blockchain_id: BSC_MAINNET_CHAIN_ID,
    token_dst_blockchain_id: ARBITRUM_MAINNET_CHAIN_ID,
    amount: 1000n,
    quote_type: 'exact_input',
  } satisfies SolverIntentQuoteRequest;

  const result = await sodax.solver.getQuote(quoteRequest);

  if (result.ok) {
    // success
  } else {
    // handle error
  }
```

### Token Approval Flow

Before creating an intent, you need to ensure that the Asset Manager contract has permission to spend your tokens. Here's how to handle the approval flow:

```typescript
import {
  SolverService,
  BSC_MAINNET_CHAIN_ID,
  ARBITRUM_MAINNET_CHAIN_ID
} from "@sodax/sdk"

const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';  // Address of the ETH token on BSC (spoke chain)
const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'; // Address of the wBTC token on ARB (spoke chain)
const evmWalletAddress = evmWalletProvider.getWalletAddress();

// First check if approval is needed
const isApproved = await sodax.solver.isAllowanceValid(
  {
    inputToken: bscEthToken,  // The address of the input token on spoke chain
    outputToken: arbWbtcToken,  // The address of the output token on spoke chain
    inputAmount: BigInt(1000000), // The amount of input tokens
    minOutputAmount: BigInt(900000), // min amount you are expecting to receive
    deadline: BigInt(0), // Optional timestamp after which intent expires (0 = no deadline)
    allowPartialFill: false, // Whether the intent can be partially filled
    srcChain: BSC_MAINNET_CHAIN_ID, // Chain ID where input tokens originate
    dstChain: ARBITRUM_MAINNET_CHAIN_ID, // Chain ID where output tokens should be delivered
    srcAddress: evmWalletAddress, // Source address (original address on spoke chain)
    dstAddress: evmWalletAddress, // Destination address (original address on spoke chain)
    solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
    data: '0x', // Additional arbitrary data
  },
  bscSpokeProvider
);

if (!isApproved.ok) {
  // Handle error
  console.error('Failed to check allowance:', isApproved.error);
} else if (!isApproved.value) {
  // Approval needed - get the Asset Manager address from the chain config
  const assetManagerAddress = bscSpokeProvider.chainConfig.addresses.assetManager;
  
  // Approve the Asset Manager to spend your tokens
  const approveResult = await sodax.solver.approve(
    bscEthToken,
    BigInt(1000000), // Amount to approve
    assetManagerAddress,
    bscSpokeProvider
  );

  if (!approveResult.ok) {
    // Handle error
    console.error('Failed to approve tokens:', approveResult.error);
  } else {
    // Wait for approval transaction to be mined
    await approveResult.value.wait();
  }
}

// Now you can proceed with creating the intent
// ... continue with createIntent or createAndSubmitIntent ...
```

### Create And Submit Intent Order (Swap)

Creating Intent Order requires creating spoke provider for the chain that intent is going to be created on (`srcChain`).

Example for BSC -> ARB Intent Order:

```typescript
  import {
    SolverService,
    SolverConfig,
    BSC_MAINNET_CHAIN_ID,
    ARBITRUM_MAINNET_CHAIN_ID
  } from "@sodax/sdk"

  const bscEthToken = '0x2170Ed0880ac9A755fd29B2688956BD959F933F8';  // Address of the ETH token on BSC (spoke chain)
  const arbWbtcToken = '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f'; // Address of the wBTC token on ARB (spoke chain)

  const createIntentParams = {
    inputToken: bscEthToken,  // The address of the input token on spoke chain
    outputToken: arbWbtcToken,  // The address of the output token on spoke chain
    inputAmount: BigInt(1000000), // The amount of input tokens
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

    /**
   *
   * Create swap which does following steps for you
   * 1. create intent deposit tx on spoke (source) chain - createIntent function
   * 2. submit tx hash to relayer API - submitIntent function
   * 3. wait for relayer to relay tx data to the hub chain (Sonic) - waitUntilIntentExecuted function
   * 4. post hub chain tx hash to the Solver API - postExecution function
   *
   * IMPORTANT: you should primarily swap function unless you require custom step by step handling
  **/

  const swapResult = await sodax.solver.swap(
    createIntentParams,
    bscSpokeProvider,
    partnerFeeAmount,
  );

    if (!swapResult.ok) {
    // handle error as described in Error Handling section
  }

  // txHash and created Intent data as Intent & FeeAmount type
  const [txHash, intent] = swapResult.value;

  /**
   *
   * Create intent transaction or return raw transaction data
   *
  **/

  // creates and submits on-chain transaction or returns raw transaction
  // NOTE: after intent is created on-chain it should also be posted
  // to Solver API and submitted to Relay API (see swap function on how it is done)
  const createIntentResult = await sodax.solver.createIntent(
    createIntentParams,
    bscSpokeProvider,
    partnerFeeAmount,
    true, // true = get raw transaction, false = execute and return tx hash
  );

  if (!createIntentResult.ok) {
    // handle error
  }

  // txHash and created Intent data as Intent & FeeAmount type
  const [rawTx, intent] = createIntentResult.value;
```

### Submit Intent to Relay API

Submit the spoke chain transaction hash to the relay API for processing. This step is required after creating an intent on the spoke chain.

```typescript
const submitPayload = {
  action: 'submit',
  params: {
    chain_id: '0x38.bsc', // Chain ID where the intent was created
    tx_hash: '0xba3dce19347264db32ced212ff1a2036f20d9d2c7493d06af15027970be061af', // Transaction hash from createIntent
  },
} satisfies IntentRelayRequest<'submit'>;

const submitResult = await sodax.solver.submitIntent(submitPayload);

if (submitResult.ok) {
  const { success, message } = submitResult.value;
  console.log('[submitIntent] success:', success);
  console.log('[submitIntent] message:', message);
} else {
  // handle error
  console.error('[submitIntent] error:', submitResult.error);
}
```

### Get Intent Order

Retrieve intent data using tx hash obtained from intent creation response.

```typescript
const intent = await sodax.solver.getIntent(txHash, hubProvider);
```

### Cancel Intent Order

Active Intent Order can be cancelled using Intent. See [Get Intent Order](#get-intent-order) on how to obtain intent.
**Note** create intent functions also return intent data for convenience.

```typescript

const result = await sodax.solver.cancelIntent(
  intent,
  bscSpokeProvider,
  hubProvider,
  false, // true = get raw transaction, false = execute and return tx hash
);

if (result.ok) {
  console.log('[cancelIntent] txHash', txResult.value);
} else {
  // handle error
  console.error('[cancelIntent] error', txResult.error);
}
```

### Get Intent Status

Retrieve status of intent.

```typescript
const result = await sodax.solver.getStatus({
    intent_tx_hash: '0x...', // tx hash of create intent blockchain transaction
  } satisfies SolverIntentStatusRequest);
```

### Get Intent Hash

Get Intent Hash (keccak256) used as an ID of intent in smart contract.

```typescript
const intentHash = sodax.solver.getIntentHash(intent);
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
const swapResult = await sodax.solver.swap(createIntentParams, bscSpokeProvider);

if (!swapResult.ok) {
  const error = swapResult.error;
  
  if (isIntentCreationFailedError(error)) {
    // Intent creation failed on the spoke chain
    // This could be due to:
    // - Insufficient token balance
    // - Invalid token addresses
    // - Network issues on the spoke chain
    // - Invalid parameters (chain IDs, addresses, etc.)
    console.error('Intent creation failed:', error.data.payload);
    console.error('Original error:', error.data.error);
    
    // You may want to retry with different parameters or check user's balance
  } else if (isIntentSubmitTxFailedError(error)) {
    // Failed to submit the spoke chain transaction to the relay API
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
    // The intent was submitted but failed to execute on the hub chain
    // This could be due to:
    // - Timeout waiting for execution
    // - Hub chain congestion
    // - Intent execution failure on hub chain
    console.error('Intent execution timeout:', error.data.payload);
    console.error('Original error:', error.data.error);
    
    // You may want to check the intent status or retry with longer timeout
  } else if (isIntentPostExecutionFailedError(error)) {
    // Failed to post execution data to the Solver API
    // This could be due to:
    // - Solver API being down
    // - Invalid execution data
    // - Network issues
    console.error('Post execution failed:', error.data);
    
    // The intent may have executed successfully, but the API call failed
    // You may want to check the intent status manually
  } else {
    // Unknown error type
    console.error('Unknown error:', error);
  }
}
```

### Handling `createIntent` Errors

The `createIntent` function has a simpler error structure since it only handles intent creation on spoke chain (source chain):

```typescript
const createIntentResult = await sodax.solver.createIntent(
  createIntentParams,
  bscSpokeProvider,
  partnerFeeAmount,
  false
);

if (!createIntentResult.ok) {
  const error = createIntentResult.error;

  // createIntent only returns IntentError<'CREATION_FAILED'>
  if (isIntentCreationFailedError(error)) {
    console.error('Intent creation failed:', error.data.payload);
    console.error('Original error:', error.data.error);

    // Common causes:
    // - Insufficient token balance (including fee)
    // - Invalid token addresses or chain IDs
    // - Network issues on the spoke chain
    // - Invalid wallet address or permissions
    // - Contract interaction failures

    // You may want to:
    // - Check user's token balance
    // - Verify token addresses and chain configurations
    // - Retry with different parameters
  }
}
```

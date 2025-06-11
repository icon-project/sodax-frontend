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
  IntentQuoteRequest,
  Result,
  IntentQuoteResponse,
  IntentErrorResponse
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
  } satisfies IntentQuoteRequest;

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
    srcAddress: evmWalletProvider.getWalletAddressBytes(), // Source address in bytes (original address on spoke chain)
    dstAddress: evmWalletProvider.getWalletAddressBytes(), // Destination address in bytes (original address on spoke chain)
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

### Create And Submit Intent Order

Creating Intent Order requires creating spoke provider for the chain that intent is going to be created on (`token_src_blockchain_id`).

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
    srcAddress: evmWalletProvider.getWalletAddressBytes(), // Source address in bytes (original address on spoke chain)
    dstAddress: evmWalletProvider.getWalletAddressBytes(), // Destination address in bytes (original address on spoke chain)
    solver: '0x0000000000000000000000000000000000000000', // Optional specific solver address (address(0) = any solver)
    data: '0x', // Additional arbitrary data
  } satisfies CreateIntentParams;

  // creates and submits on-chain transaction or returns raw transaction
  // NOTE: after intent is created on-chain it should also be posted to Solver API and submitted to Relay API
  // see below example of createAndSubmitIntent which does that for you
  const createIntentOnlyResult = await sodax.solver.createIntent(
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

  // create on-chain intent, post to Solver API and Submit to Relay API
  // IMPORTANT: you should primarily use this one to create and submit intent
  const createAndSubmitIntentResult = await sodax.solver.createAndSubmitIntent(
    createIntentParams,
    bscSpokeProvider,
    partnerFeeAmount,
  );

    if (!createAndSubmitIntentResult.ok) {
    // handle error
  }

  // txHash and created Intent data as Intent & FeeAmount type
  const [txHash, intent] = createIntentResult.value;
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
```

### Get Intent Status

Retrieve status of intent.

```typescript
const result = await sodax.solver.getStatus({
    intent_tx_hash: '0x...', // tx hash of create intent blockchain transaction
  } satisfies IntentStatusRequest);
```

### Get Intent Hash

Get Intent Hash (keccak256) used as an ID of intent in smart contract.

```typescript
const intentHash = sodax.solver.getIntentHash(intent);
```

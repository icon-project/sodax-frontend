# Money Market

Money Market part of SDK provides abstractions to assist you with interacting with the cross-chain Money Market Smart Contracts.

## Using SDK Config and Constants

SDK includes predefined configurations of supported chains, tokens and other relevant information for the client to consume.

```typescript
import { supportedSpokeChains, getSupportedSolverTokens, SpokeChainId, Token } from "@sodax/sdk"

// all supported spoke chains
export const spokeChains: SpokeChainId[] = supportedSpokeChains;

// using spoke chain id to retrieve supported tokens address (on spoke chain = original address) for money market
const supportedMoneyMarketTokens: readonly Token[] = getSupportedMoneyMarketTokens(spokeChainId)

// check if token address for given spoke chain id is supported
const isMoneyMarketSupportedToken: boolean = isMoneyMarketSupportedToken(spokeChainId, token)

// Get all supported reserves (hub chain token addresses, i.e. money market on Sonic chain)
const supportedReserves = sodax.moneyMarket.getSupportedReserves();
```

Please refer to [SDK constants.ts](https://github.com/icon-project/sodax-frontend/blob/main/packages/sdk/src/constants.ts) for more.

### Initialising Spoke Provider

Refer to [Initialising Spoke Provider](../README.md#initialising-spoke-provider) section to see how BSC spoke provider used as `bscSpokeProvider` can be created.

## Allowance and Approval

Before making a money market action (supply, repay, withdraw, borrow), you need to ensure the money market contract has sufficient allowance to spend your tokens. The SDK provides methods to check and set allowances for different types of spoke providers:

### Checking Allowance

The `isAllowanceValid` method checks if the current allowance is sufficient for the specified action:

```typescript
import { MoneyMarketSupplyParams, MoneyMarketRepayParams } from "@sodax/sdk";

// Check if allowance is sufficient for supply
const supplyParams: MoneyMarketSupplyParams = {
  token: '0x...', // Address of the token (spoke chain) to supply
  amount: 1000n, // Amount to supply (in token decimals)
  action: 'supply',
};

const isAllowanceValid = await sodax.moneyMarket.isAllowanceValid(supplyParams, spokeProvider);

if (!isAllowanceValid.ok) {
  // Handle error
  return;
}

if (!isAllowanceValid.value) {
  // Need to approve - allowance is insufficient
}
```

### Setting Allowance

The `approve` method sets the allowance for the specified action. The spender address varies depending on the spoke provider type:

- **EVM Spoke Chains**: The spender is the asset manager contract
- **Sonic Spoke (Hub) Chain**: The spender is the user router contract (for supply/repay) or specific approval contracts (for withdraw/borrow)

```typescript
import { MoneyMarketSupplyParams, MoneyMarketRepayParams } from "@sodax/sdk";

// Parameters for supply operation
const supplyParams: MoneyMarketSupplyParams = {
  token: '0x...', // Address of the token (spoke chain) to supply
  amount: 1000n, // Amount to supply (in token decimals)
  action: 'supply',
};

// First check if allowance is sufficient
const isAllowanceValid = await sodax.moneyMarket.isAllowanceValid(supplyParams, spokeProvider);

if (!isAllowanceValid.ok) {
  // Handle error
  return;
}

if (!isAllowanceValid.value) {
  // Approve the money market contract to spend tokens
  const approveResult = await sodax.moneyMarket.approve(
    supplyParams,
    spokeProvider,
    false // Optional: true = return raw transaction data, false = execute and return transaction hash (default: false)
  );

  if (!approveResult.ok) {
    // Handle approval error
    return;
  }

  // Transaction hash or raw transaction data
  const txResult = approveResult.value;
}
```

### Supported Actions by Provider Type

The allowance and approval system supports different actions depending on the spoke provider type:

**EVM Spoke Providers:**
- `supply` - Approves the asset manager contract to spend tokens
- `repay` - Approves the asset manager contract to spend tokens

**Sonic Spoke Provider (Hub Chain):**
- `supply` - Approves the user router contract to spend tokens
- `repay` - Approves the user router contract to spend tokens  
- `withdraw` - Approves the withdraw operation using SonicSpokeService
- `borrow` - Approves the borrow operation using SonicSpokeService

### Complete Example

Here's a complete example showing the allowance check and approval flow:

```typescript
import { MoneyMarketSupplyParams } from "@sodax/sdk";

const supplyParams: MoneyMarketSupplyParams = {
  token: '0x...', // Address of the token (spoke chain) to supply
  amount: 1000n, // Amount to supply (in token decimals)
  action: 'supply',
};

// Step 1: Check if allowance is sufficient
const allowanceCheck = await sodax.moneyMarket.isAllowanceValid(supplyParams, spokeProvider);

if (!allowanceCheck.ok) {
  console.error('Allowance check failed:', allowanceCheck.error);
  return;
}

// Step 2: Approve if allowance is insufficient
if (!allowanceCheck.value) {
  console.log('Insufficient allowance, approving...');
  
  const approveResult = await sodax.moneyMarket.approve(supplyParams, spokeProvider);
  
  if (!approveResult.ok) {
    console.error('Approval failed:', approveResult.error);
    return;
  }
  
  console.log('Approval successful:', approveResult.value);
}

// Step 3: Now you can proceed with supply
const supplyResult = await sodax.moneyMarket.supply(supplyParams, spokeProvider);

if (supplyResult.ok) {
  const [spokeTxHash, hubTxHash] = supplyResult.value;
  console.log('Supply successful:', { spokeTxHash, hubTxHash });
} else {
  console.error('Supply failed:', supplyResult.error);
}
```

## Supply Tokens

Supply tokens to the money market pool. There are two methods available:

1. `supplyAndSubmit`: Supplies tokens and submits the intent to the Solver API
2. `supply`: Supplies tokens without submitting to the Solver API

```typescript
import { MoneyMarketSupplyParams, DEFAULT_RELAY_TX_TIMEOUT } from "@sodax/sdk";

// Parameters for supply operation
const supplyParams: MoneyMarketSupplyParams = {
  token: '0x...', // Address of the token (spoke chain) to supply
  amount: 1000n, // Amount to supply (in token decimals)
};

// First check and set allowance if needed
const isAllowanceValid = await sodax.moneyMarket.isAllowanceValid(supplyParams, spokeProvider);

if (!isAllowanceValid.ok || !isAllowanceValid.value) {
  const approveResult = await sodax.moneyMarket.approve(
    supplyParams.token as Address,
    supplyParams.amount,
    spokeProvider.chainConfig.addresses.assetManager,
    spokeProvider
  );

  if (!approveResult.ok) {
    // Handle approval error
    return;
  }
}

// Supply and submit to Solver API
const supplyAndSubmitResult = await sodax.moneyMarket.supply(
  supplyParams,
  spokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT // Optional: timeout in milliseconds (default: 1 minute)
);

if (supplyAndSubmitResult.ok) {
  const [spokeTxHash, hubTxHash] = supplyAndSubmitResult.value;
  // Handle success
} else {
  // Handle error
}

// Create supply intent only (without submitting to Solver API)
const supplyResult = await sodax.moneyMarket.createSupplyIntent(
  supplyParams,
  spokeProvider,
  false // Optional: whether to return raw transaction (default: false)
);

if (supplyResult.ok) {
  const txHash = supplyResult.value;
  // Handle success
} else {
  // Handle error
}
```

## Borrow Tokens

Borrow tokens from the money market pool. There are two methods available:

1. `borrowAndSubmit`: Borrows tokens and submits the intent to the Solver API
2. `borrow`: Borrows tokens without submitting to the Solver API

```typescript
import { MoneyMarketBorrowParams, DEFAULT_RELAY_TX_TIMEOUT } from "@sodax/sdk";

// Parameters for borrow operation
const borrowParams: MoneyMarketBorrowParams = {
  token: '0x...', // Address of the token (spoke chain) to supply
  amount: 1000n, // Amount to borrow (in token decimals)
};

// Borrow and submit to Solver API
const borrowAndSubmitResult = await sodax.moneyMarket.borrow(
  borrowParams,
  spokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT // Optional: timeout in milliseconds (default: 1 minute)
);

if (borrowAndSubmitResult.ok) {
  const [spokeTxHash, hubTxHash] = borrowAndSubmitResult.value;
  // Handle success
} else {
  // Handle error
}

// Create borrow intent only (without submitting to Solver API)
const borrowResult = await sodax.moneyMarket.createBorrowIntent(
  borrowParams,
  spokeProvider,
  false // Optional: whether to return raw transaction (default: false)
);

if (borrowResult.ok) {
  const txHash = borrowResult.value;
  // Handle success
} else {
  // Handle error
}
```

## Withdraw Tokens

Withdraw tokens from the money market pool. There are two methods available:

1. `withdrawAndSubmit`: Withdraws tokens and submits the intent to the Solver API
2. `withdraw`: Withdraws tokens without submitting to the Solver API

```typescript
import { MoneyMarketWithdrawParams, DEFAULT_RELAY_TX_TIMEOUT } from "@sodax/sdk";

// Parameters for withdraw operation
const withdrawParams: MoneyMarketWithdrawParams = {
  token: '0x...', // Address of the token (spoke chain) to supply
  amount: 1000n, // Amount to withdraw (in token decimals)
};

// Withdraw and submit to Solver API
const withdrawAndSubmitResult = await sodax.moneyMarket.withdraw(
  withdrawParams,
  spokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT // Optional: timeout in milliseconds (default: 1 minute)
);

if (withdrawAndSubmitResult.ok) {
  const [spokeTxHash, hubTxHash] = withdrawAndSubmitResult.value;
  // Handle success
} else {
  // Handle error
}

// Create withdraw intent only (without submitting to Solver API)
const withdrawResult = await sodax.moneyMarket.createWithdrawIntent(
  withdrawParams,
  spokeProvider,
  false // Optional: whether to return raw transaction (default: false)
);

if (withdrawResult.ok) {
  const txHash = withdrawResult.value;
  // Handle success
} else {
  // Handle error
}
```

## Repay Tokens

Repay tokens to the money market pool. There are two methods available:

1. `repayAndSubmit`: Repays tokens and submits the intent to the Solver API
2. `repay`: Repays tokens without submitting to the Solver API

```typescript
import { MoneyMarketRepayParams, DEFAULT_RELAY_TX_TIMEOUT } from "@sodax/sdk";

// Parameters for repay operation
const repayParams: MoneyMarketRepayParams = {
  token: '0x...', // Address of the token (spoke chain) to supply
  amount: 1000n, // Amount to repay (in token decimals)
};

// First check and set allowance if needed
const isAllowanceValid = await sodax.moneyMarket.isAllowanceValid(repayParams, spokeProvider);

if (!isAllowanceValid.ok || !isAllowanceValid.value) {
  const approveResult = await sodax.moneyMarket.approve(
    repayParams.token as Address,
    repayParams.amount,
    spokeProvider.chainConfig.addresses.assetManager,
    spokeProvider
  );

  if (!approveResult.ok) {
    // Handle approval error
    return;
  }
}

// Repay and submit to Solver API
const repayAndSubmitResult = await sodax.moneyMarket.repay(
  repayParams,
  spokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT // Optional: timeout in milliseconds (default: 1 minute)
);

if (repayAndSubmitResult.ok) {
  const [spokeTxHash, hubTxHash] = repayAndSubmitResult.value;
  // Handle success
} else {
  // Handle error
}

// Create repay intent only (without submitting to Solver API)
const repayResult = await sodax.moneyMarket.createRepayIntent(
  repayParams,
  spokeProvider,
  false // Optional: whether to return raw transaction (default: false)
);

if (repayResult.ok) {
  const txHash = repayResult.value;
  // Handle success
} else {
  // Handle error
}
```

## Error Handling

Error handling for Money Market operations is complex due to the multi-step nature of cross-chain transactions. The SDK provides specific error types and type guards to help you handle different failure scenarios appropriately.

### Error Types

All Money Market methods return a `Result` type that can be either successful or contain an error:

```typescript
type MoneyMarketError<T extends MoneyMarketErrorCode> = {
  code: T;
  data: GetMoneyMarketError<T>;
};

type MoneyMarketErrorCode =
  | RelayErrorCode
  | 'CREATE_SUPPLY_INTENT_FAILED'
  | 'CREATE_BORROW_INTENT_FAILED'
  | 'CREATE_WITHDRAW_INTENT_FAILED'
  | 'CREATE_REPAY_INTENT_FAILED'
  | 'SUPPLY_UNKNOWN_ERROR'
  | 'BORROW_UNKNOWN_ERROR'
  | 'WITHDRAW_UNKNOWN_ERROR'
  | 'REPAY_UNKNOWN_ERROR';
```

Where `RelayErrorCode` includes:
- `'SUBMIT_TX_FAILED'` - Failed to submit the spoke chain transaction to the relay API
- `'RELAY_TIMEOUT'` - Timeout waiting for transaction execution on the hub chain

### Using Error Type Guards

The SDK provides type guards to help you narrow down error types safely:

```typescript
import {
  isMoneyMarketSubmitTxFailedError,
  isMoneyMarketRelayTimeoutError,
  isMoneyMarketCreateSupplyIntentFailedError,
  isMoneyMarketCreateBorrowIntentFailedError,
  isMoneyMarketCreateWithdrawIntentFailedError,
  isMoneyMarketCreateRepayIntentFailedError,
  isMoneyMarketSupplyUnknownError,
  isMoneyMarketBorrowUnknownError,
  isMoneyMarketWithdrawUnknownError,
  isMoneyMarketRepayUnknownError,
} from '@sodax/sdk';
```

### Handling Money Market Operation Errors

Money Market operations (supply, borrow, withdraw, repay) perform multiple operations in sequence, and each step can fail. Use the type guards to handle errors safely:

```typescript
const result = await sodax.moneyMarket.supply(params, spokeProvider);

if (!result.ok) {
  const error = result.error;
  
  if (isMoneyMarketSubmitTxFailedError(error)) {
    // Failed to submit the spoke chain transaction to the relay API
    // IMPORTANT: This is a critical event and you should retry submit
    // and store relevant payload information in localStorage or
    // similar local permanent memory. If client leaves the session
    // in this critical moment their funds might get stuck until
    // successful re-submission is made.
    //
    // This could be due to:
    // - Relay API being down
    // - Invalid transaction hash
    // - Network connectivity issues
    console.error('Submit transaction failed:', error.data.error);
    console.log('Transaction hash that failed to submit:', error.data.payload);
    
    // You may want to retry the submission or check relay API status
  } else if (isMoneyMarketRelayTimeoutError(error)) {
    // The transaction was submitted but failed to execute on the hub chain
    // This could be due to:
    // - Timeout waiting for execution
    // - Hub chain congestion
    // - Transaction execution failure on hub chain
    console.error('Transaction execution timeout:', error.data.error);
    console.log('Transaction hash that timed out:', error.data.payload);
    
    // You may want to check the transaction status or retry with longer timeout
  } else if (isMoneyMarketSupplyUnknownError(error)) {
    // Handle supply-specific unknown errors
    console.error('Supply operation failed:', error.data.error);
    console.log('Supply parameters:', error.data.payload);
  } else if (isMoneyMarketBorrowUnknownError(error)) {
    // Handle borrow-specific unknown errors
    console.error('Borrow operation failed:', error.data.error);
    console.log('Borrow parameters:', error.data.payload);
  } else if (isMoneyMarketWithdrawUnknownError(error)) {
    // Handle withdraw-specific unknown errors
    console.error('Withdraw operation failed:', error.data.error);
    console.log('Withdraw parameters:', error.data.payload);
  } else if (isMoneyMarketRepayUnknownError(error)) {
    // Handle repay-specific unknown errors
    console.error('Repay operation failed:', error.data.error);
    console.log('Repay parameters:', error.data.payload);
  } else {
    // Handle other error cases
    console.error('Unexpected error:', error);
  }
}
```

### Handling Create Intent Errors

The `create*Intent` methods (createSupplyIntent, createBorrowIntent, etc.) have a simpler error structure since they only handle transaction creation on the spoke chain:

```typescript
const createIntentResult = await sodax.moneyMarket.createSupplyIntent(
  supplyParams,
  spokeProvider,
  false
);

if (!createIntentResult.ok) {
  const error = createIntentResult.error;

  if (isMoneyMarketCreateSupplyIntentFailedError(error)) {
    console.error('Supply intent creation failed:', error.data.error);
    console.log('Supply parameters:', error.data.payload);
    
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
  } else if (isMoneyMarketCreateBorrowIntentFailedError(error)) {
    console.error('Borrow intent creation failed:', error.data.error);
    console.log('Borrow parameters:', error.data.payload);
  } else if (isMoneyMarketCreateWithdrawIntentFailedError(error)) {
    console.error('Withdraw intent creation failed:', error.data.error);
    console.log('Withdraw parameters:', error.data.payload);
  } else if (isMoneyMarketCreateRepayIntentFailedError(error)) {
    console.error('Repay intent creation failed:', error.data.error);
    console.log('Repay parameters:', error.data.payload);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Handling Allowance and Approval Errors

Allowance and approval operations have simpler error handling:

```typescript
const allowanceCheck = await sodax.moneyMarket.isAllowanceValid(params, spokeProvider);

if (!allowanceCheck.ok) {
  console.error('Allowance check failed:', allowanceCheck.error);
  // Handle error - could be network issues, invalid parameters, etc.
}

if (!allowanceCheck.value) {
  const approveResult = await sodax.moneyMarket.approve(params, spokeProvider);
  
  if (!approveResult.ok) {
    console.error('Approval failed:', approveResult.error);
    // Handle approval error - could be insufficient balance, network issues, etc.
  }
}
```

### Error Data Structure

Each error type contains specific data that can help with debugging and error handling:

```typescript
// Relay errors (SUBMIT_TX_FAILED, RELAY_TIMEOUT)
type MoneyMarketSubmitTxFailedError = {
  error: RelayError;
  payload: SpokeTxHash; // The transaction hash that failed
};

// Create intent errors
type MoneyMarketSupplyFailedError = {
  error: unknown;
  payload: MoneyMarketSupplyParams; // The original parameters
};

// Unknown errors
type MoneyMarketUnknownError<T extends MoneyMarketUnknownErrorCode> = {
  error: unknown;
  payload: GetMoneyMarketParams<T>; // The original parameters
};
```

### Best Practices for Error Handling

1. **Always check for `SUBMIT_TX_FAILED` errors**: These are critical and require immediate attention to prevent funds from getting stuck.

2. **Store transaction data locally**: When a `SUBMIT_TX_FAILED` error occurs, store the transaction hash and parameters locally so you can retry submission even if the user leaves the session.

3. **Use type guards**: Leverage the provided type guards to safely handle different error types without type casting.

4. **Access error payloads**: Use the error payload data to provide better user feedback and debugging information.

5. **Implement retry logic**: For network-related errors, implement exponential backoff retry logic.

6. **Provide user feedback**: Give users clear, actionable error messages based on the error type.

7. **Monitor timeouts**: Use appropriate timeout values and inform users when operations take longer than expected.

8. **Check transaction status**: After timeouts, check the actual transaction status on the blockchain to determine if the operation succeeded despite the timeout.

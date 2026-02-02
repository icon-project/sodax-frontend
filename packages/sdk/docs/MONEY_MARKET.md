# Money Market

Money Market part of SDK provides abstractions to assist you with interacting with the cross-chain Money Market Smart Contracts.

All money market operations are accessed through the `moneyMarket` property of a `Sodax` instance:

```typescript
import { Sodax, type SpokeChainId, type Token } from "@sodax/sdk";

const sodax = new Sodax();

// All money market methods are available through sodax.moneyMarket
const supplyResult = await sodax.moneyMarket.supply(supplyParams, spokeProvider);
```

## Using SDK Config and Constants

SDK includes predefined configurations of supported chains, tokens and other relevant information for the client to consume. All configurations are accessible through the `config` property of the Sodax instance (`sodax.config`), or through service-specific properties for convenience.

**IMPORTANT**: If you want dynamic (backend API based - contains latest tokens) configuration, make sure to initialize the instance before usage:
```typescript
await sodax.initialize();
```
By default, configuration from the specific SDK version you are using is used.

```typescript
import { Sodax, type SpokeChainId, type Token, type Address } from "@sodax/sdk";

const sodax = new Sodax();
await sodax.initialize(); // Initialize for dynamic config (optional)

// All supported spoke chains (general config)
const spokeChains: SpokeChainId[] = sodax.config.getSupportedSpokeChains();

// Get supported money market tokens for a specific chain
const supportedMoneyMarketTokens: readonly Token[] = sodax.moneyMarket.getSupportedTokensByChainId(chainId);

// Get all supported money market tokens per chain
const allMoneyMarketTokens = sodax.moneyMarket.getSupportedTokens();

// Get all supported reserves (hub chain token addresses, i.e. money market on Sonic chain)
const supportedReserves: readonly Address[] = sodax.moneyMarket.getSupportedReserves();

// Check if token address for given spoke chain id is supported (through config service)
const isMoneyMarketSupportedToken: boolean = sodax.config.isMoneyMarketSupportedToken(chainId, token);

// Alternative: Access through config service
const moneyMarketTokensFromConfig: readonly Token[] = sodax.config.getSupportedMoneyMarketTokensByChainId(chainId);
const allMoneyMarketTokensFromConfig = sodax.config.getSupportedMoneyMarketTokens();
```

Please refer to [SDK constants.ts](https://github.com/icon-project/sodax-frontend/blob/main/packages/types/src/constants/index.ts) for additional static constants and configurations.

## Available Methods

All money market methods are accessible through `sodax.moneyMarket`:

### Token & Reserve Configuration
- `getSupportedTokensByChainId(chainId)` - Get supported money market tokens for a specific chain
- `getSupportedTokens()` - Get all supported money market tokens per chain
- `getSupportedReserves()` - Get all supported money market reserves (hub chain addresses)

### Allowance & Approval
- `isAllowanceValid(params, spokeProvider)` - Check if token approval is needed
- `approve(params, spokeProvider, raw?)` - Approve tokens or request trustline (Stellar)

### Money Market Operations
- `supply(params, spokeProvider, timeout?)` - Supply tokens (complete operation with relay)
- `createSupplyIntent(params, spokeProvider, raw?)` - Create supply intent only
- `borrow(params, spokeProvider, timeout?)` - Borrow tokens (complete operation with relay)
- `createBorrowIntent(params, spokeProvider, raw?)` - Create borrow intent only
- `withdraw(params, spokeProvider, timeout?)` - Withdraw tokens (complete operation with relay)
- `createWithdrawIntent(params, spokeProvider, raw?)` - Create withdraw intent only
- `repay(params, spokeProvider, timeout?)` - Repay tokens (complete operation with relay)
- `createRepayIntent(params, spokeProvider, raw?)` - Create repay intent only

### Data Retrieval & Formatting
- `data.getReservesList()` - Get list of all reserve addresses
- `data.getReservesData()` - Get raw aggregated reserve data
- `data.getReservesHumanized()` - Get humanized reserve data
- `data.getReserveData(asset)` - Get specific reserve data
- `data.getUserReservesData(spokeProvider)` - Get raw user reserve data
- `data.getUserReservesHumanized(spokeProvider)` - Get humanized user reserve data
- `data.formatReservesUSD(request)` - Format reserves with USD conversions
- `data.formatUserSummary(request)` - Format user portfolio summary with USD conversions

### Utility Methods
- `MoneyMarketService.estimateGas(rawTx, spokeProvider)` - Estimate gas for raw transactions (static method)

### Initialising Spoke Provider

Refer to [Initialising Spoke Provider](../README.md#initialising-spoke-provider) section to see how BSC spoke provider used as `bscSpokeProvider` can be created.

### Function Parameters Structure

All money market functions use object parameters for better readability and extensibility. The common parameter structure includes:

- **`params`**: The money market operation parameters (`MoneyMarketSupplyParams`, `MoneyMarketBorrowParams`, `MoneyMarketWithdrawParams`, or `MoneyMarketRepayParams`) containing token address, amount, and action type
- **`spokeProvider`**: The spoke provider instance for the source chain
- **`raw`**: (Optional) Whether to return raw transaction data instead of executing the transaction. Used in `create*Intent` and `approve` methods. Default: `false`
- **`timeout`**: (Optional) Timeout in milliseconds for relay operations (default: 60 seconds). Used in `supply`, `borrow`, `withdraw`, and `repay` methods

## Allowance and Approval

Before making a money market action (supply, repay, withdraw, borrow), you need to ensure the money market contract has sufficient allowance to spend your tokens. The SDK provides methods to check and set allowances for different types of spoke providers.

**Note**: For Stellar-based operations, the allowance and approval system works differently:
- **Source Chain (Stellar)**: The standard `isAllowanceValid` and `approve` methods work as expected for EVM chains, but for Stellar as the source chain, these methods check and establish trustlines automatically.
- **Destination Chain (Stellar)**: When Stellar is specified as the destination chain, frontends/clients need to manually establish trustlines before executing money market actions using `StellarSpokeService.hasSufficientTrustline` and `StellarSpokeService.requestTrustline` functions.

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

### Stellar Trustline Requirements

For Stellar-based money market operations, you need to handle trustlines differently depending on whether Stellar is the source or destination chain. See [Stellar Trustline Requirements](./STELLAR_TRUSTLINE.md#money-market) for detailed information and code examples.

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

### Estimate Gas for Raw Transactions

The `estimateGas` function allows you to estimate the gas cost for raw transactions before executing them. This is particularly useful for money market operations (supply, borrow, withdraw, repay) and approval transactions to provide users with accurate gas estimates.

```typescript
import { MoneyMarketService, MoneyMarketSupplyParams } from "@sodax/sdk";

// Example: Estimate gas for a supply transaction
const supplyResult = await sodax.moneyMarket.createSupplyIntent(
  supplyParams,
  spokeProvider,
  true, // true = get raw transaction
);

if (supplyResult.ok) {
  const rawTx = supplyResult.value;
  
  // Estimate gas for the raw transaction (static method)
  // Note: MoneyMarketService.estimateGas is a static method
  const gasEstimate = await MoneyMarketService.estimateGas(rawTx, spokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas for supply:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas for supply:', gasEstimate.error);
  }
}

// Example: Estimate gas for an approval transaction
const approveResult = await sodax.moneyMarket.approve(
  supplyParams,
  spokeProvider,
  true // true = get raw transaction
);

if (approveResult.ok) {
  const rawTx = approveResult.value;
  
  // Estimate gas for the approval transaction (static method)
  const gasEstimate = await MoneyMarketService.estimateGas(rawTx, spokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas for approval:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas for approval:', gasEstimate.error);
  }
}

// Example: Estimate gas for a borrow transaction
const borrowResult = await sodax.moneyMarket.createBorrowIntent(
  borrowParams,
  spokeProvider,
  true // true = get raw transaction
);

if (borrowResult.ok) {
  const rawTx = borrowResult.value;
  
  // Estimate gas for the borrow transaction
  const gasEstimate = await MoneyMarketService.estimateGas(rawTx, spokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas for borrow:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas for borrow:', gasEstimate.error);
  }
}

// Example: Estimate gas for a withdraw transaction
const withdrawResult = await sodax.moneyMarket.createWithdrawIntent(
  withdrawParams,
  spokeProvider,
  true // true = get raw transaction
);

if (withdrawResult.ok) {
  const rawTx = withdrawResult.value;
  
  // Estimate gas for the withdraw transaction
  const gasEstimate = await MoneyMarketService.estimateGas(rawTx, spokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas for withdraw:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas for withdraw:', gasEstimate.error);
  }
}

// Example: Estimate gas for a repay transaction
const repayResult = await sodax.moneyMarket.createRepayIntent(
  repayParams,
  spokeProvider,
  true // true = get raw transaction
);

if (repayResult.ok) {
  const rawTx = repayResult.value;
  
  // Estimate gas for the repay transaction
  const gasEstimate = await MoneyMarketService.estimateGas(rawTx, spokeProvider);
  
  if (gasEstimate.ok) {
    console.log('Estimated gas for repay:', gasEstimate.value);
  } else {
    console.error('Failed to estimate gas for repay:', gasEstimate.error);
  }
}
```

## Supply Tokens

Supply tokens to the money market pool. There are two methods available:

1. `supply`: Supply tokens to the money market pool, relay the transaction to the hub and submit the intent to the Solver API
2. `createSupplyIntent`: Create supply intent only (without relay and submit to Solver API)

```typescript
import { MoneyMarketSupplyParams, DEFAULT_RELAY_TX_TIMEOUT } from "@sodax/sdk";

// Parameters for supply operation
const supplyParams: MoneyMarketSupplyParams = {
  token: '0x...', // Address of the token (spoke chain) to supply
  amount: 1000n, // Amount to supply (in token decimals)
  action: 'supply',
};

// First check and set allowance if needed
const isAllowanceValid = await sodax.moneyMarket.isAllowanceValid(supplyParams, spokeProvider);

if (!isAllowanceValid.ok) {
  // Handle error
  console.error('Allowance check failed:', isAllowanceValid.error);
  return;
}

if (!isAllowanceValid.value) {
  // Approve the money market contract to spend tokens
  const approveResult = await sodax.moneyMarket.approve(
    supplyParams,
    spokeProvider,
    false // Optional: true = return raw transaction, false = execute and return tx hash (default: false)
  );

  if (!approveResult.ok) {
    // Handle approval error
    console.error('Approval failed:', approveResult.error);
    return;
  }

  // Wait for approval transaction to be confirmed before proceeding
  const txHash = approveResult.value;
  console.log('Approval transaction:', txHash);
}

// Supply and submit to Solver API (complete operation)
const supplyAndSubmitResult = await sodax.moneyMarket.supply(
  supplyParams,
  spokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT // Optional: timeout in milliseconds (default: 60 seconds)
);

if (supplyAndSubmitResult.ok) {
  const [spokeTxHash, hubTxHash] = supplyAndSubmitResult.value;
  console.log('Supply successful:', { spokeTxHash, hubTxHash });
} else {
  // Handle error
  console.error('Supply failed:', supplyAndSubmitResult.error);
}

// Create supply intent only (without submitting to Solver API)
const supplyResult = await sodax.moneyMarket.createSupplyIntent(
  supplyParams,
  spokeProvider,
  false // Optional: whether to return raw transaction (default: false)
);

if (supplyResult.ok) {
  const txHash = supplyResult.value;
  console.log('Supply intent created:', txHash);
} else {
  // Handle error
  console.error('Supply intent creation failed:', supplyResult.error);
}
```

## Borrow Tokens

Borrow tokens from the money market pool. There are two methods available:

1. `borrow`: Borrow tokens from the money market pool, relay the transaction to the hub and submit the intent to the Solver API
2. `createBorrowIntent`: Create borrow intent only (without relay and submit to Solver API)

```typescript
import { MoneyMarketBorrowParams, DEFAULT_RELAY_TX_TIMEOUT } from "@sodax/sdk";

// Parameters for borrow operation
const borrowParams: MoneyMarketBorrowParams = {
  token: '0x...', // Address of the token (spoke chain) to borrow
  amount: 1000n, // Amount to borrow (in token decimals)
  action: 'borrow',
};

// Borrow and submit to Solver API (complete operation)
const borrowAndSubmitResult = await sodax.moneyMarket.borrow(
  borrowParams,
  spokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT // Optional: timeout in milliseconds (default: 60 seconds)
);

if (borrowAndSubmitResult.ok) {
  const [spokeTxHash, hubTxHash] = borrowAndSubmitResult.value;
  console.log('Borrow successful:', { spokeTxHash, hubTxHash });
} else {
  // Handle error
  console.error('Borrow failed:', borrowAndSubmitResult.error);
}

// Create borrow intent only (without submitting to Solver API)
const borrowResult = await sodax.moneyMarket.createBorrowIntent(
  borrowParams,
  spokeProvider,
  false // Optional: whether to return raw transaction (default: false)
);

if (borrowResult.ok) {
  const txHash = borrowResult.value;
  console.log('Borrow intent created:', txHash);
} else {
  // Handle error
  console.error('Borrow intent creation failed:', borrowResult.error);
}
```

## Withdraw Tokens

Withdraw tokens from the money market pool. There are two methods available:

1. `withdraw`: Withdraw tokens from the money market pool, relay the transaction to the hub and submit the intent to the Solver API
2. `createWithdrawIntent`: Create withdraw intent only (without relay and submit to Solver API)

```typescript
import { MoneyMarketWithdrawParams, DEFAULT_RELAY_TX_TIMEOUT } from "@sodax/sdk";

// Parameters for withdraw operation
const withdrawParams: MoneyMarketWithdrawParams = {
  token: '0x...', // Address of the token (spoke chain) to withdraw
  amount: 1000n, // Amount to withdraw (in token decimals)
  action: 'withdraw',
};

// Withdraw and submit to Solver API (complete operation)
const withdrawAndSubmitResult = await sodax.moneyMarket.withdraw(
  withdrawParams,
  spokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT // Optional: timeout in milliseconds (default: 60 seconds)
);

if (withdrawAndSubmitResult.ok) {
  const [spokeTxHash, hubTxHash] = withdrawAndSubmitResult.value;
  console.log('Withdraw successful:', { spokeTxHash, hubTxHash });
} else {
  // Handle error
  console.error('Withdraw failed:', withdrawAndSubmitResult.error);
}

// Create withdraw intent only (without submitting to Solver API)
const withdrawResult = await sodax.moneyMarket.createWithdrawIntent(
  withdrawParams,
  spokeProvider,
  false // Optional: whether to return raw transaction (default: false)
);

if (withdrawResult.ok) {
  const txHash = withdrawResult.value;
  console.log('Withdraw intent created:', txHash);
} else {
  // Handle error
  console.error('Withdraw intent creation failed:', withdrawResult.error);
}
```

## Repay Tokens

Repay tokens to the money market pool. There are two methods available:

1. `repay`: Repay tokens to the money market pool, relay the transaction to the hub and submit the intent to the Solver API
2. `createRepayIntent`: Create repay intent only (without relay and submit to Solver API)

```typescript
import { MoneyMarketRepayParams, DEFAULT_RELAY_TX_TIMEOUT } from "@sodax/sdk";

// Parameters for repay operation
const repayParams: MoneyMarketRepayParams = {
  token: '0x...', // Address of the token (spoke chain) to repay
  amount: 1000n, // Amount to repay (in token decimals)
  action: 'repay',
};

// First check and set allowance if needed
const isAllowanceValid = await sodax.moneyMarket.isAllowanceValid(repayParams, spokeProvider);

if (!isAllowanceValid.ok) {
  // Handle error
  console.error('Allowance check failed:', isAllowanceValid.error);
  return;
}

if (!isAllowanceValid.value) {
  // Approve the money market contract to spend tokens
  const approveResult = await sodax.moneyMarket.approve(
    repayParams,
    spokeProvider,
    false // Optional: true = return raw transaction, false = execute and return tx hash (default: false)
  );

  if (!approveResult.ok) {
    // Handle approval error
    console.error('Approval failed:', approveResult.error);
    return;
  }

  // Wait for approval transaction to be confirmed before proceeding
  const txHash = approveResult.value;
  console.log('Approval transaction:', txHash);
}

// Repay and submit to Solver API (complete operation)
const repayAndSubmitResult = await sodax.moneyMarket.repay(
  repayParams,
  spokeProvider,
  DEFAULT_RELAY_TX_TIMEOUT // Optional: timeout in milliseconds (default: 60 seconds)
);

if (repayAndSubmitResult.ok) {
  const [spokeTxHash, hubTxHash] = repayAndSubmitResult.value;
  console.log('Repay successful:', { spokeTxHash, hubTxHash });
} else {
  // Handle error
  console.error('Repay failed:', repayAndSubmitResult.error);
}

// Create repay intent only (without submitting to Solver API)
const repayResult = await sodax.moneyMarket.createRepayIntent(
  repayParams,
  spokeProvider,
  false // Optional: whether to return raw transaction (default: false)
);

if (repayResult.ok) {
  const txHash = repayResult.value;
  console.log('Repay intent created:', txHash);
} else {
  // Handle error
  console.error('Repay intent creation failed:', repayResult.error);
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

## Data Retrieval and Formatting

The Money Market SDK provides comprehensive data retrieval and formatting capabilities through the `MoneyMarketDataService`. This service allows you to fetch reserve data, user data, and format them into human-readable values with USD conversions.

### Available Data Methods

The SDK provides several methods to retrieve different types of data:

#### Reserve Data
- `getReservesList()` - Get list of all reserve addresses
- `getReservesData()` - Get raw aggregated reserve data
- `getReservesHumanized()` - Get humanized reserve data with normalized decimals
- `getReserveData(asset)` - Get specific reserve data for an asset
- `getReserveNormalizedIncome(asset)` - Get normalized income for a specific asset

#### User Data
- `getUserReservesData(spokeProvider)` - Get raw user reserve data
- `getUserReservesHumanized(spokeProvider)` - Get humanized user reserve data

#### E-Mode Data
- `getEModes()` - Get raw E-Mode data
- `getEModesHumanized()` - Get humanized E-Mode data

### Data Formatting

The SDK provides powerful formatting capabilities to convert raw blockchain data into human-readable values with USD conversions:

#### Formatting Reserve Data
- `formatReservesUSD()` - Format reserves with USD conversions
- `formatReserveUSD()` - Format a single reserve with USD conversion

#### Formatting User Data
- `formatUserSummary()` - Format user portfolio summary with USD conversions

**NOTE** if you need more customized formatting checkout [math-utils](https://github.com/icon-project/sodax-frontend/tree/main/packages/sdk/src/moneyMarket/math-utils).

### Complete Example: Fetching and Formatting Data

Here's a complete example showing how to retrieve and format money market data:

```typescript
// Fetch reserves data
const reserves = await sodax.moneyMarket.data.getReservesHumanized();

// Format reserves with USD conversions
const formattedReserves = sodax.moneyMarket.data.formatReservesUSD(
  sodax.moneyMarket.data.buildReserveDataWithPrice(reserves),
);

// Fetch user reserves data
const userReserves = await sodax.moneyMarket.data.getUserReservesHumanized(spokeProvider);

// Format user summary with USD conversions
const userSummary = sodax.moneyMarket.data.formatUserSummary(
  sodax.moneyMarket.data.buildUserSummaryRequest(reserves, formattedReserves, userReserves),
);

// Display formatted data
console.log('formattedReserves:', formattedReserves);
console.log('userSummary:', userSummary);
```

### Step-by-Step Data Retrieval Process

#### 1. Fetch Raw Data

First, retrieve the raw data from the blockchain:

```typescript
// Get humanized reserves data (normalized decimals)
const reserves = await sodax.moneyMarket.data.getReservesHumanized();

// Get user reserves data for a specific spoke provider
const userReserves = await sodax.moneyMarket.data.getUserReservesHumanized(spokeProvider);
```

#### 2. Build Formatting Requests

Use the helper methods to build the formatting requests:

```typescript
// Build request for reserve formatting
const reserveFormatRequest = sodax.moneyMarket.data.buildReserveDataWithPrice(reserves);

// Build request for user summary formatting
const userSummaryRequest = sodax.moneyMarket.data.buildUserSummaryRequest(
  reserves,
  formattedReserves,
  userReserves,
);
```

#### 3. Format Data

Apply the formatting to get human-readable values with USD conversions:

```typescript
// Format reserves with USD values
const formattedReserves = sodax.moneyMarket.data.formatReservesUSD(reserveFormatRequest);

// Format user summary with USD values
const userSummary = sodax.moneyMarket.data.formatUserSummary(userSummaryRequest);
```

### Data Structure Examples

#### Formatted Reserve Data

The `formattedReserves` array contains objects with the following structure:

```typescript
type FormattedReserve = {
  // Basic reserve information
  symbol: string;
  name: string;
  decimals: number;
  address: string;
  
  // Supply information
  totalScaledVariableDebt: string;
  availableLiquidity: string;
  totalPrincipalStableDebt: string;
  averageStableRate: string;
  liquidityIndex: string;
  variableBorrowIndex: string;
  lastUpdateTimestamp: number;
  
  // USD values
  totalLiquidityUSD: string;
  totalVariableDebtUSD: string;
  totalStableDebtUSD: string;
  availableLiquidityUSD: string;
  
  // Rates and factors
  liquidityRate: string;
  variableBorrowRate: string;
  stableBorrowRate: string;
  averageStableRate: string;
  liquidityIndex: string;
  variableBorrowIndex: string;
  
  // Configuration
  usageAsCollateralEnabledOnUser: boolean;
  borrowingEnabled: boolean;
  stableBorrowRateEnabled: boolean;
  isActive: boolean;
  isFrozen: boolean;
  
  // E-Mode
  eModeCategoryId: number;
  
  // Price information
  priceInMarketReferenceCurrency: string;
  priceInUsd: string;
};
```

#### Formatted User Summary

The `userSummary` object contains the user's portfolio information:

```typescript
type FormattedUserSummary = {
  // Total portfolio values
  totalCollateralUSD: string;
  totalBorrowsUSD: string;
  totalLiquidityUSD: string;
  totalFeesUSD: string;
  totalRewardsUSD: string;
  
  // Health factor and borrowing power
  healthFactor: string;
  availableBorrowsUSD: string;
  availableBorrowsMarketReferenceCurrency: string;
  
  // Liquidation information
  totalCollateralMarketReferenceCurrency: string;
  totalBorrowsMarketReferenceCurrency: string;
  totalFeesMarketReferenceCurrency: string;
  totalRewardsMarketReferenceCurrency: string;
  
  // Current timestamp
  currentTimestamp: number;
  
  // Market reference currency info
  marketReferenceCurrencyDecimals: number;
  marketReferenceCurrencyPriceInUsd: string;
  
  // E-Mode information
  userEmodeCategoryId: number;
};
```

### Utility Functions

The SDK also provides utility functions for formatting specific values:

```typescript
import { formatPercentage, formatBasisPoints } from '@sodax/sdk';

// Format percentage values (e.g., interest rates)
// rateValue is a bigint representing the rate with 27 decimals
const rateValue = 52500000000000000000000000n; // 5.25% with 27 decimals
const formattedRate = formatPercentage(rateValue, 27); // Returns "5.25%"

// Format basis points
// basisPointsValue is a bigint representing basis points (1 basis point = 0.01%)
const basisPointsValue = 250n; // 250 basis points = 2.50%
const formattedBasisPoints = formatBasisPoints(basisPointsValue); // Returns "2.50%"

// Example with different values
const highRate = 150000000000000000000000000n; // 15% with 27 decimals
const highRateFormatted = formatPercentage(highRate, 27); // Returns "15.00%"

const lowBasisPoints = 50n; // 50 basis points = 0.50%
const lowBasisPointsFormatted = formatBasisPoints(lowBasisPoints); // Returns "0.50%"
```

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
const supplyResult = await sodax.moneyMarket.supplyAndSubmit(supplyParams, spokeProvider);

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
const supplyAndSubmitResult = await sodax.moneyMarket.supplyAndSubmit(
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

// Supply only (without submitting to Solver API)
const supplyResult = await sodax.moneyMarket.supply(
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
const borrowAndSubmitResult = await sodax.moneyMarket.borrowAndSubmit(
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

// Borrow only (without submitting to Solver API)
const borrowResult = await sodax.moneyMarket.borrow(
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
const withdrawAndSubmitResult = await sodax.moneyMarket.withdrawAndSubmit(
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

// Withdraw only (without submitting to Solver API)
const withdrawResult = await sodax.moneyMarket.withdraw(
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
const repayAndSubmitResult = await sodax.moneyMarket.repayAndSubmit(
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

// Repay only (without submitting to Solver API)
const repayResult = await sodax.moneyMarket.repay(
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

All methods return a `Result` type that can be either successful or contain an error:

```typescript
type MoneyMarketError = {
  code: MoneyMarketErrorCode;
  error: unknown;
};

type MoneyMarketErrorCode =
  | RelayErrorCode
  | 'UNKNOWN'
  | 'SUPPLY_FAILED'
  | 'BORROW_FAILED'
  | 'WITHDRAW_FAILED'
  | 'REPAY_FAILED';
```

Example error handling:

```typescript
const result = await sodax.moneyMarket.supplyAndSubmit(params, spokeProvider);

if (!result.ok) {
  switch (result.error.code) {
    case 'SUPPLY_FAILED':
      // Handle supply failure
      break;
    case 'UNKNOWN':
      // Handle unknown error
      break;
    // ... handle other error cases
  }
}
```

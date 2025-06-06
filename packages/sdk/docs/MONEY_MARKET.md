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
```

### Initialising Spoke Provider

Refer to [Initialising Spoke Provider](../README.md#initialising-spoke-provider) section to see how BSC spoke provider used as `bscSpokeProvider` can be created.

## Allowance and Approval

Before supplying or repaying tokens, you need to ensure the money market contract has sufficient allowance to spend your tokens. The SDK provides methods to check and set allowances:

```typescript
import { MoneyMarketSupplyParams, MoneyMarketRepayParams } from "@sodax/sdk";

// Check if allowance is sufficient for supply
const supplyParams: MoneyMarketSupplyParams = {
  token: '0x...', // Address of the token to supply
  amount: 1000n, // Amount to supply (in token decimals)
};

const isAllowanceValid = await sodax.moneyMarket.isAllowanceValid(supplyParams, spokeProvider);

if (!isAllowanceValid.ok || !isAllowanceValid.value) {
  // Approve the money market contract to spend tokens
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

// Now you can proceed with supply
```

## Supply Tokens

Supply tokens to the money market pool. There are two methods available:

1. `supplyAndSubmit`: Supplies tokens and submits the intent to the Solver API
2. `supply`: Supplies tokens without submitting to the Solver API

```typescript
import { MoneyMarketSupplyParams, DEFAULT_RELAY_TX_TIMEOUT } from "@sodax/sdk";

// Parameters for supply operation
const supplyParams: MoneyMarketSupplyParams = {
  token: '0x...', // Address of the token to supply
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
  token: '0x...', // Address of the token to borrow
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
  token: '0x...', // Address of the token to withdraw
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
  token: '0x...', // Address of the token to repay
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

## Get Supported Tokens and Reserves

You can get information about supported tokens and reserves:

```typescript
// Get supported tokens for a specific chain (token addresses are native to the chain id)
const supportedTokens = sodax.moneyMarket.getSupportedTokens(chainId);

// Get all supported reserves (hub chain token addresses, e.g. Sonic chain)
const supportedReserves = sodax.moneyMarket.getSupportedReserves();
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

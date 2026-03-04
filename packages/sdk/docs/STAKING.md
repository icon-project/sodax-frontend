# Staking Documentation

The `StakingService` class reachable through `sodax.staking` instance provides functionality for staking SODA tokens, unstaking, claiming rewards, and retrieving staking information. It supports operations across different blockchain chains with automatic hub chain integration.

## Methods

### isAllowanceValid

Checks if the current allowance is sufficient for the staking operations.

**Parameters:**
- `params`: Staking parameters including action type and amount
- `spokeProvider`: The spoke chain provider instance

**Returns:** `Promise<Result<boolean, StakingError<'ALLOWANCE_CHECK_FAILED'>>>`

**Note**: For Stellar-based operations, the allowance system works differently:
- **Source Chain (Stellar)**: The standard `isAllowanceValid` method works as expected for EVM chains, but for Stellar as the source chain, this method checks and establishes trustlines automatically.
- **Staking Flow**: Staking operations always flow from spoke chains (including Stellar) to the hub chain (Sonic), so Stellar is only used as a source chain for staking operations.

**Example:**
```typescript
const result = await sodax.staking.isAllowanceValid({
  params: {
    amount: 1000000000000000000n, // 1 SODA
    minReceive: 950000000000000000n, // 0.95 xSODA minimum
    account: '0x1234567890abcdef...',
    action: 'stake'
  },
  spokeProvider: baseSpokeProvider
});

if (result.ok && result.value) {
  console.log('Allowance is sufficient');
} else {
  console.log('Need to approve tokens first');
}
```

### approve

Approves token spending for the staking operations. This method is only supported for EVM-based spoke chains.

**Parameters:**
- `params`: Staking parameters
- `spokeProvider`: The spoke provider instance
- `raw`: Whether to return raw transaction data (optional, default: false)

**Returns:** `Promise<Result<TxReturnType<S, R>, StakingError<'APPROVAL_FAILED'>>>`

**Note**: For Stellar-based operations, the approval system works differently:
- **Source Chain (Stellar)**: The standard `approve` method works as expected for EVM chains, but for Stellar as the source chain, this method establishes trustlines automatically.
- **Staking Flow**: Staking operations always flow from spoke chains (including Stellar) to the hub chain (Sonic), so Stellar is only used as a source chain for staking operations.

**Example:**
```typescript
const result = await sodax.staking.approve({
  params: {
    amount: 1000000000000000000n,
    minReceive: 950000000000000000n,
    account: '0x1234567890abcdef...',
    action: 'stake'
  },
  spokeProvider: baseSpokeProvider,
  raw: false
});

if (result.ok) {
  console.log('Approval transaction hash:', result.value);
} else {
  console.error('Approval failed:', result.error);
}
```

### Stellar Trustline Requirements

For Stellar-based staking operations, you need to handle trustlines when Stellar is used as the source chain. See [Stellar Trustline Requirements](./STELLAR_TRUSTLINE.md#staking) for detailed information and code examples.

**Note**: Staking operations always flow from spoke chains (including Stellar) to the hub chain (Sonic), so Stellar is only used as a source chain for staking operations.

### stake

Executes a complete stake transaction, including creating the stake intent and relaying it to the hub chain.

**Parameters:**
- `params`: Stake parameters including amount, minimum receive amount, and account
- `spokeProvider`: The spoke chain provider instance
- `timeout`: Optional timeout in milliseconds (default: 60 seconds)

**Returns:** `Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'STAKE_FAILED'> | RelayError>>`

**Example:**
```typescript
const result = await sodax.staking.stake(
  {
    amount: 1000000000000000000n, // 1 SODA
    minReceive: 950000000000000000n, // 0.95 xSODA minimum
    account: '0x1234567890abcdef...',
    action: 'stake'
  },
  baseSpokeProvider,
  30000
);

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('Stake successful:', { spokeTxHash, hubTxHash });
} else {
  console.error('Stake failed:', result.error);
}
```

### createStakeIntent

Creates a stake intent on the spoke chain without relaying it to the hub. This is useful for advanced users who want to handle the relaying process manually.

**Parameters:**
- `params`: Stake parameters including amount, minimum receive amount, and account
- `spokeProvider`: The spoke chain provider instance
- `raw`: Whether to return raw transaction data (optional, default: false)

**Returns:** `Promise<Result<TxReturnType<S, R>, StakingError<'STAKE_FAILED'>> & { data?: { address: string; payload: Hex } }>`

**Example:**
```typescript
const result = await sodax.staking.createStakeIntent({
  params: {
    amount: 1000000000000000000n,
    minReceive: 950000000000000000n,
    account: '0x1234567890abcdef...',
    action: 'stake'
  },
  spokeProvider: baseSpokeProvider,
  raw: false
});

if (result.ok) {
  console.log('Stake intent created:', result.value);
  console.log('Extra data:', result.data);
} else {
  console.error('Stake intent creation failed:', result.error);
}
```

**Note:** This method only executes the transaction on the spoke chain and creates the stake intent. To successfully stake tokens, you need to:
1. Check if the allowance is sufficient using `isAllowanceValid`
2. Approve the appropriate contract to spend the tokens using `approve`
3. Create the stake intent using this method
4. Relay the transaction to the hub and await completion using the `stake` method

### unstake

Executes a complete unstake transaction for unstaking xSoda shares.

**Parameters:**
- `params`: Unstake parameters including amount and account
- `spokeProvider`: The spoke chain provider instance
- `timeout`: Optional timeout in milliseconds (default: 60 seconds)

**Returns:** `Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'UNSTAKE_FAILED'> | RelayError>>`

**Example:**
```typescript
const result = await sodax.staking.unstake(
  {
    amount: 1000000000000000000n, // 1 xSODA
    account: '0x1234567890abcdef...',
    action: 'unstake'
  },
  baseSpokeProvider,
  30000
);

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('Unstake successful:', { spokeTxHash, hubTxHash });
} else {
  console.error('Unstake failed:', result.error);
}
```

### createUnstakeIntent

Creates an unstake intent on the spoke chain without relaying it to the hub.

**Parameters:**
- `params`: Unstake parameters including amount and account
- `spokeProvider`: The spoke chain provider instance
- `raw`: Whether to return raw transaction data (optional, default: false)

**Returns:** `Promise<Result<TxReturnType<S, R>, StakingError<'UNSTAKE_FAILED'>> & { data?: { address: string; payload: Hex } }>`

**Example:**
```typescript
const result = await sodax.staking.createUnstakeIntent({
  params: {
    amount: 1000000000000000000n,
    account: '0x1234567890abcdef...',
    action: 'unstake'
  },
  spokeProvider: baseSpokeProvider,
  raw: false
});

if (result.ok) {
  console.log('Unstake intent created:', result.value);
  console.log('Extra data:', result.data);
} else {
  console.error('Unstake intent creation failed:', result.error);
}
```

**Note:** This method only executes the transaction on the spoke chain and creates the unstake intent. To successfully unstake tokens, you need to:
1. Check if the allowance is sufficient using `isAllowanceValid`
2. Approve the appropriate contract to spend the tokens using `approve`
3. Create the unstake intent using this method
4. Relay the transaction to the hub and await completion using the `unstake` method

### instantUnstake

Executes a complete instant unstake transaction for instantly unstaking xSoda shares.

**Parameters:**
- `params`: Instant unstake parameters including amount, minimum amount, and account
- `spokeProvider`: The spoke chain provider instance
- `timeout`: Optional timeout in milliseconds (default: 60 seconds)

**Returns:** `Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'INSTANT_UNSTAKE_FAILED'> | RelayError>>`

**Example:**
```typescript
const result = await sodax.staking.instantUnstake(
  {
    amount: 1000000000000000000n, // 1 xSODA
    minAmount: 950000000000000000n, // 0.95 SODA minimum
    account: '0x1234567890abcdef...',
    action: 'instantUnstake'
  },
  baseSpokeProvider,
  30000
);

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('Instant unstake successful:', { spokeTxHash, hubTxHash });
} else {
  console.error('Instant unstake failed:', result.error);
}
```

### createInstantUnstakeIntent

Creates an instant unstake intent on the spoke chain without relaying it to the hub.

**Parameters:**
- `params`: Instant unstake parameters including amount, minimum amount, and account
- `spokeProvider`: The spoke chain provider instance
- `raw`: Whether to return raw transaction data (optional, default: false)

**Returns:** `Promise<Result<TxReturnType<S, R>, StakingError<'INSTANT_UNSTAKE_FAILED'>> & { data?: { address: string; payload: Hex } }>`

**Example:**
```typescript
const result = await sodax.staking.createInstantUnstakeIntent({
  params: {
    amount: 1000000000000000000n,
    minAmount: 950000000000000000n,
    account: '0x1234567890abcdef...',
    action: 'instantUnstake'
  },
  spokeProvider: baseSpokeProvider,
  raw: false
});

if (result.ok) {
  console.log('Instant unstake intent created:', result.value);
  console.log('Extra data:', result.data);
} else {
  console.error('Instant unstake intent creation failed:', result.error);
}
```

**Note:** This method only executes the transaction on the spoke chain and creates the instant unstake intent. To successfully instant unstake tokens, you need to:
1. Create the instant unstake intent using this method
2. Relay the transaction to the hub and await completion using the `instantUnstake` method

### claim

Executes a complete claim transaction for claiming unstaked tokens after the unstaking period.

**Parameters:**
- `params`: Claim parameters including requestId and claimable amount
- `spokeProvider`: The spoke chain provider instance
- `timeout`: Optional timeout in milliseconds (default: 60 seconds)

**Returns:** `Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'CLAIM_FAILED'> | RelayError>>`

**Example:**
```typescript
const result = await sodax.staking.claim(
  {
    requestId: 1n,
    amount: 950000000000000000n, // claimable amount after penalty
    action: 'claim'
  },
  baseSpokeProvider,
  30000
);

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('Claim successful:', { spokeTxHash, hubTxHash });
} else {
  console.error('Claim failed:', result.error);
}
```

### createClaimIntent

Creates a claim intent on the spoke chain without relaying it to the hub.

**Parameters:**
- `params`: Claim parameters including requestId and claimable amount
- `spokeProvider`: The spoke chain provider instance
- `raw`: Whether to return raw transaction data (optional, default: false)

**Returns:** `Promise<Result<TxReturnType<S, R>, StakingError<'CLAIM_FAILED'>> & { data?: { address: string; payload: Hex } }>`

**Example:**
```typescript
const result = await sodax.staking.createClaimIntent({
  params: {
    requestId: 1n,
    amount: 950000000000000000n,
    action: 'claim'
  },
  spokeProvider: baseSpokeProvider,
  raw: false
});

if (result.ok) {
  console.log('Claim intent created:', result.value);
  console.log('Extra data:', result.data);
} else {
  console.error('Claim intent creation failed:', result.error);
}
```

**Note:** This method only executes the transaction on the spoke chain and creates the claim intent. To successfully claim tokens, you need to:
1. Create the claim intent using this method
2. Relay the transaction to the hub and await completion using the `claim` method

### cancelUnstake

Executes a complete cancel unstake transaction for cancelling an unstake request.

**Parameters:**
- `params`: Cancel unstake parameters including requestId
- `spokeProvider`: The spoke chain provider instance
- `timeout`: Optional timeout in milliseconds (default: 60 seconds)

**Returns:** `Promise<Result<[SpokeTxHash, HubTxHash], StakingError<'CANCEL_UNSTAKE_FAILED'> | RelayError>>`

**Example:**
```typescript
const result = await sodax.staking.cancelUnstake(
  {
    requestId: 1n,
    action: 'cancelUnstake'
  },
  baseSpokeProvider,
  30000
);

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('Cancel unstake successful:', { spokeTxHash, hubTxHash });
} else {
  console.error('Cancel unstake failed:', result.error);
}
```

### createCancelUnstakeIntent

Creates a cancel unstake intent on the spoke chain without relaying it to the hub.

**Parameters:**
- `params`: Cancel unstake parameters including requestId
- `spokeProvider`: The spoke chain provider instance
- `raw`: Whether to return raw transaction data (optional, default: false)

**Returns:** `Promise<Result<TxReturnType<S, R>, StakingError<'CANCEL_UNSTAKE_FAILED'>> & { data?: { address: string; payload: Hex } }>`

**Example:**
```typescript
const result = await sodax.staking.createCancelUnstakeIntent({
  params: {
    requestId: 1n,
    action: 'cancelUnstake'
  },
  spokeProvider: baseSpokeProvider,
  raw: false
});

if (result.ok) {
  console.log('Cancel unstake intent created:', result.value);
  console.log('Extra data:', result.data);
} else {
  console.error('Cancel unstake intent creation failed:', result.error);
}
```

**Note:** This method only executes the transaction on the spoke chain and creates the cancel unstake intent. To successfully cancel an unstake request, you need to:
1. Create the cancel unstake intent using this method
2. Relay the transaction to the hub and await completion using the `cancelUnstake` method

### getStakingInfoFromSpoke

Retrieves comprehensive staking information for a user using spoke provider.

**Parameters:**
- `spokeProvider`: The spoke chain provider instance

**Returns:** `Promise<Result<StakingInfo, StakingError<'INFO_FETCH_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.staking.getStakingInfoFromSpoke(baseSpokeProvider);

if (result.ok) {
  const stakingInfo = result.value;
  console.log('Total staked:', stakingInfo.totalStaked.toString());
  console.log('User xSODA balance:', stakingInfo.userXSodaBalance.toString());
  console.log('User xSODA value:', stakingInfo.userXSodaValue.toString());
} else {
  console.error('Failed to get staking info:', result.error);
}
```

### getStakingInfo

Retrieves comprehensive staking information for a user by address.

**Parameters:**
- `userAddress`: The user's address

**Returns:** `Promise<Result<StakingInfo, StakingError<'INFO_FETCH_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.staking.getStakingInfo('0x1234567890abcdef...');

if (result.ok) {
  const stakingInfo = result.value;
  console.log('Total staked:', stakingInfo.totalStaked.toString());
  console.log('User xSODA balance:', stakingInfo.userXSodaBalance.toString());
  console.log('User xSODA value:', stakingInfo.userXSodaValue.toString());
} else {
  console.error('Failed to get staking info:', result.error);
}
```

### getUnstakingInfo

Retrieves unstaking information for a user.

**Parameters:**
- `param`: The user's address or spoke provider

**Returns:** `Promise<Result<UnstakingInfo, StakingError<'INFO_FETCH_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.staking.getUnstakingInfo(baseSpokeProvider);

if (result.ok) {
  const unstakingInfo = result.value;
  console.log('Total unstaking:', unstakingInfo.totalUnstaking.toString());
  console.log('Unstake requests:', unstakingInfo.userUnstakeSodaRequests.length);
} else {
  console.error('Failed to get unstaking info:', result.error);
}
```

### getUnstakingInfoWithPenalty

Retrieves unstaking information with penalty calculations for a user.

**Parameters:**
- `param`: The user's address or spoke provider

**Returns:** `Promise<Result<UnstakingInfo & { requestsWithPenalty: UnstakeRequestWithPenalty[] }, StakingError<'INFO_FETCH_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.staking.getUnstakingInfoWithPenalty(baseSpokeProvider);

if (result.ok) {
  const unstakingInfo = result.value;
  console.log('Total unstaking:', unstakingInfo.totalUnstaking.toString());
  
  unstakingInfo.requestsWithPenalty.forEach((request, index) => {
    console.log(`Request ${index}:`);
    console.log('  Amount:', request.request.amount.toString());
    console.log('  Penalty:', request.penalty.toString());
    console.log('  Penalty %:', request.penaltyPercentage);
    console.log('  Claimable:', request.claimableAmount.toString());
  });
} else {
  console.error('Failed to get unstaking info with penalty:', result.error);
}
```

### getStakingConfig

Retrieves staking configuration from the stakedSoda contract.

**Returns:** `Promise<Result<StakingConfig, StakingError<'INFO_FETCH_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.staking.getStakingConfig();

if (result.ok) {
  const config = result.value;
  console.log('Unstaking period:', config.unstakingPeriod.toString(), 'seconds');
  console.log('Min unstaking period:', config.minUnstakingPeriod.toString(), 'seconds');
  console.log('Max penalty:', config.maxPenalty.toString(), '%');
} else {
  console.error('Failed to get staking config:', result.error);
}
```

### getInstantUnstakeRatio

Retrieves the instant unstake ratio for a given amount.

**Parameters:**
- `amount`: The amount of xSoda to estimate instant unstake for

**Returns:** `Promise<Result<bigint, StakingError<'INFO_FETCH_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.staking.getInstantUnstakeRatio(1000000000000000000n);

if (result.ok) {
  console.log('Instant unstake ratio:', result.value.toString());
} else {
  console.error('Failed to get instant unstake ratio:', result.error);
}
```

### getConvertedAssets

Retrieves converted assets amount for xSODA shares.

**Parameters:**
- `amount`: The amount of xSoda shares to convert

**Returns:** `Promise<Result<bigint, StakingError<'INFO_FETCH_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.staking.getConvertedAssets(1000000000000000000n);

if (result.ok) {
  console.log('Converted assets:', result.value.toString());
} else {
  console.error('Failed to get converted assets:', result.error);
}
```

### getStakeRatio

Retrieves stake ratio for a given amount (xSoda amount and preview deposit).

**Parameters:**
- `amount`: The amount of SODA to estimate stake for

**Returns:** `Promise<Result<[bigint, bigint], StakingError<'INFO_FETCH_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.staking.getStakeRatio(1000000000000000000n);

if (result.ok) {
  const [xSodaAmount, previewDepositAmount] = result.value;
  console.log('xSODA amount:', xSodaAmount.toString());
  console.log('Preview deposit amount:', previewDepositAmount.toString());
} else {
  console.error('Failed to get stake ratio:', result.error);
}
```

## Types

### StakeParams

```typescript
export type StakeParams = {
  amount: bigint; // amount to stake
  minReceive: bigint; // minimum amount to receive
  account: Address; // account to stake from
  action: 'stake';
};
```

### UnstakeParams

```typescript
export type UnstakeParams = {
  amount: bigint;
  account: Address;
  action: 'unstake';
};
```

### ClaimParams

```typescript
export type ClaimParams = {
  requestId: bigint;
  amount: bigint; // claimable amount after penalty calculation
  action: 'claim';
};
```

### CancelUnstakeParams

```typescript
export type CancelUnstakeParams = {
  requestId: bigint;
  action: 'cancelUnstake';
};
```

### InstantUnstakeParams

```typescript
export type InstantUnstakeParams = {
  amount: bigint;
  minAmount: bigint;
  account: Address;
  action: 'instantUnstake';
};
```

### StakingInfo

```typescript
export type StakingInfo = {
  totalStaked: bigint; // Total SODA staked (totalAssets from xSODA vault)
  totalUnderlying: bigint; // Total underlying SODA assets in the vault
  userXSodaBalance: bigint; // User's xSODA shares (raw balance)
  userXSodaValue: bigint; // User's xSODA value in SODA (converted)
  userUnderlying: bigint; // User's underlying SODA amount
};
```

### UnstakingInfo

```typescript
export type UnstakingInfo = {
  userUnstakeSodaRequests: readonly UserUnstakeInfo[];
  totalUnstaking: bigint;
};
```

### UnstakeRequestWithPenalty

```typescript
export type UnstakeRequestWithPenalty = UserUnstakeInfo & {
  penalty: bigint;
  penaltyPercentage: number;
  claimableAmount: bigint;
};
```

### StakingConfig

```typescript
export type StakingConfig = {
  unstakingPeriod: bigint; // in seconds
  minUnstakingPeriod: bigint; // in seconds
  maxPenalty: bigint; // percentage (1-100)
};
```

### StakingAction

```typescript
export type StakingAction = 'stake' | 'unstake' | 'claim' | 'cancelUnstake' | 'instantUnstake';
```

## Error Handling

All methods return a `Result` type that indicates success or failure:

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Common error codes include:
- `STAKE_FAILED`: Stake transaction failed
- `UNSTAKE_FAILED`: Unstake transaction failed
- `INSTANT_UNSTAKE_FAILED`: Instant unstake transaction failed
- `CLAIM_FAILED`: Claim transaction failed
- `CANCEL_UNSTAKE_FAILED`: Cancel unstake transaction failed
- `INFO_FETCH_FAILED`: Failed to fetch staking information
- `ALLOWANCE_CHECK_FAILED`: Insufficient allowance for the transaction
- `APPROVAL_FAILED`: Token approval transaction failed

## Usage Flow

The typical staking operation follows this sequence:

1. **Check allowance** using `isAllowanceValid()`
2. **Approve tokens** using `approve()` if needed
3. **For Stellar source chains**: Check and establish trustlines (see [Stellar Trustline Requirements](./STELLAR_TRUSTLINE.md#staking))
4. **Execute staking operation** using `stake()`, `unstake()`, `instantUnstake()`, `claim()`, or `cancelUnstake()`
5. **Monitor progress** using the returned transaction hashes

## Supported Chains

The service supports various blockchain networks as source chains for staking operations:
- EVM chains (Ethereum, Polygon, Base, etc.)
- Sonic (hub chain - can be both source and destination)
- Non-EVM chains (Icon, Sui, Stellar, etc.)

**Note**: All staking operations flow from spoke chains (including Stellar) to the hub chain (Sonic). Stellar and other non-EVM chains can only be used as source chains for staking operations.

## Penalty System

The staking system includes a penalty mechanism for early unstaking:

- **Minimum Unstaking Period**: No penalty if unstaking after this period
- **Maximum Penalty**: Applied if unstaking before the minimum period
- **Reduction Period**: Penalty gradually reduces between minimum and full unstaking periods

The penalty is calculated based on the time elapsed since the unstake request was initiated.

## Instant Unstaking

Instant unstaking allows users to immediately receive SODA tokens in exchange for xSODA shares, but with a reduced amount due to the instant liquidity mechanism. The actual amount received depends on the current liquidity pool and is calculated using the `getInstantUnstakeRatio` method.

# Bridge Documentation

The `BridgeService` class reachable through `sodax.bridge`instance provides functionality to bridge tokens between different blockchain chains. It supports both cross-chain transfers between spoke chains and operations involving the hub chain (Sonic) using Soda tokens.

## Methods

### isAllowanceValid

Checks if the current allowance is sufficient for the bridge transaction.

**Parameters:**
- `params`: Bridge parameters including source chain, asset, and amount
- `spokeProvider`: The spoke chain provider instance

**Returns:** `Promise<Result<boolean, BridgeError<'ALLOWANCE_CHECK_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.bridge.isAllowanceValid({
  params: {
    srcChainId: '0x2105.base',
    srcAsset: '0x1234567890abcdef...',
    amount: 1000000000000000000n, // 1 token
    dstChainId: '0x89.polygon',
    dstAsset: '0xabcdef1234567890...',
    recipient: '0x9876543210fedcba...'
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

Approves token spending for the bridge transaction. This method is only supported for EVM-based spoke chains.

**Parameters:**
- `params`: Bridge parameters
- `spokeProvider`: The spoke chain provider instance
- `raw`: Whether to return raw transaction data (optional)

**Returns:** `Promise<Result<TxReturnType<S, R>, BridgeError<'APPROVAL_FAILED'>>>`

**Example:**
```typescript
const result = await sodax.bridge.approve({
  params: {
    srcChainId: '0x2105.base',
    srcAsset: '0x1234567890abcdef...',
    amount: 1000000000000000000n,
    dstChainId: '0x89.polygon',
    dstAsset: '0xabcdef1234567890...',
    recipient: '0x9876543210fedcba...'
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

### bridge

Executes a complete bridge transaction, including creating the bridge intent and relaying it to the hub chain.

**Parameters:**
- `params`: Bridge parameters
- `spokeProvider`: The spoke chain provider instance
- `timeout`: Optional timeout in milliseconds (default: 60 seconds)

**Returns:** `Promise<Result<[SpokeTxHash, HubTxHash], BridgeError<BridgeErrorCode>>>`

**Example:**
```typescript
const result = await sodax.bridge.bridge({
  params: {
    srcChainId: '0x2105.base',
    srcAsset: '0x1234567890abcdef...',
    amount: 1000000000000000000n,
    dstChainId: '0x89.polygon',
    dstAsset: '0xabcdef1234567890...',
    recipient: '0x9876543210fedcba...',
    partnerFee: { 
      address: '0xpartner123...', 
      percentage: 0.1 
    }
  },
  spokeProvider: baseSpokeProvider,
  timeout: 30000
});

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('Bridge successful:', { spokeTxHash, hubTxHash });
} else {
  console.error('Bridge failed:', result.error);
}
```

### createBridgeIntent

Creates a bridge intent on the spoke chain without relaying it to the hub. This is useful for advanced users who want to handle the relaying process manually.

**Parameters:**
- `params`: Bridge parameters
- `spokeProvider`: The spoke chain provider instance
- `raw`: Whether to return raw transaction data (optional)

**Returns:** `Promise<Result<TxReturnType<S, R>, BridgeError<'CREATE_BRIDGE_INTENT_FAILED'>> & BridgeOptionalExtraData>`

**Example:**
```typescript
const result = await sodax.bridge.createBridgeIntent({
  params: {
    srcChainId: '0x2105.base',
    srcAsset: '0x1234567890abcdef...',
    amount: 1000000000000000000n,
    dstChainId: '0x89.polygon',
    dstAsset: '0xabcdef1234567890...',
    recipient: '0x9876543210fedcba...'
  },
  spokeProvider: baseSpokeProvider,
  raw: false
});

if (result.ok) {
  console.log('Bridge intent created:', result.value);
  console.log('Extra data:', result.data);
} else {
  console.error('Bridge intent creation failed:', result.error);
}
```

### getSpokeAssetManagerTokenBalance

Retrieves the deposited token balance held by the asset manager on a spoke chain. This balance represents available liquidity for bridging operations.

**Parameters:**
- `chainId`: The spoke chain ID
- `token`: The token address to query

**Returns:** `Promise<bigint>` - Token balance (returns -1n for no bridgable limit on Sonic)

**Example:**
```typescript
const balance = await sodax.bridge.getSpokeAssetManagerTokenBalance(
  '0x89.polygon',
  '0xabcdef1234567890...'
);

if (balance === -1n) {
  console.log('No bridgable limit on this chain');
} else {
  console.log('Available balance:', balance.toString());
}
```

### isBridgeable

Checks if two assets on different chains are bridgeable by verifying they share the same vault on the hub chain.

**Parameters:**
- `from`: Source X token
- `to`: Destination X token
- `unchecked`: Whether to skip chain ID validation (optional, default: false)

**Returns:** `boolean` - true if assets are bridgeable, false otherwise

**Example:**
```typescript
const isBridgeable = sodax.bridge.isBridgeable({
  from: {
    address: '0x1234567890abcdef...',
    xChainId: '0x2105.base',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  },
  to: {
    address: '0xabcdef1234567890...',
    xChainId: '0x89.polygon',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  }
});

console.log('Assets are bridgeable:', isBridgeable);
```

### getBridgeableTokens

Retrieves all bridgeable tokens from a source token to a destination chain.

**Parameters:**
- `from`: Source chain ID
- `to`: Destination chain ID
- `token`: Source token address

**Returns:** `XToken[]` - Array of bridgeable tokens on the destination chain

**Example:**
```typescript
const bridgeableTokens = sodax.bridge.getBridgeableTokens(
  '0x2105.base',
  '0x89.polygon',
  '0x1234567890abcdef...'
);

console.log('Bridgeable tokens on Polygon:', bridgeableTokens);
// Output: Array of XToken objects that can be bridged to
```

## Error Handling

All methods return a `Result` type that indicates success or failure:

```typescript
type Result<T, E> = 
  | { ok: true; value: T }
  | { ok: false; error: E };
```

Common error codes include:
- `ALLOWANCE_CHECK_FAILED`: Insufficient allowance for the transaction
- `APPROVAL_FAILED`: Token approval transaction failed
- `CREATE_BRIDGE_INTENT_FAILED`: Failed to create bridge intent
- `BRIDGE_FAILED`: General bridge operation failure

## Usage Flow

The typical bridge operation follows this sequence:

1. **Check allowance** using `isAllowanceValid()`
2. **Approve tokens** using `approve()` if needed
3. **Execute bridge** using `bridge()` or `createBridgeIntent()` + manual relaying
4. **Monitor progress** using the returned transaction hashes

## Supported Chains

The service supports various blockchain networks including:
- EVM chains (Ethereum, Polygon, Base, etc.)
- Sonic (hub chain)
- Non-EVM chains (Icon, Sui, Stellar, etc.)

## Partner Fees

You can specify partner fees when bridging tokens:

```typescript
partnerFee: {
  address: '0xpartner123...',
  percentage: 0.1 // 10% fee
}
```

Fees are denominated in vault token decimals (18 decimals).

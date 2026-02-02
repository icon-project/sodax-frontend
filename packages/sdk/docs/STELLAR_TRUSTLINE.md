# Stellar Trustline Requirements

Stellar blockchain requires trustlines to be established before you can receive or hold tokens. This document explains how to handle trustlines when using Stellar with the Sodax SDK across different operations.

## Overview

In Stellar, trustlines are required to:

- **Receive tokens**: You must establish a trustline before receiving any token on Stellar
- **Hold tokens**: You cannot hold tokens without an active trustline

The SDK handles trustlines differently depending on whether Stellar is used as the source chain or destination chain:

- **Source Chain (Stellar)**: The SDK automatically handles trustlines through the standard `isAllowanceValid` and `approve` methods
- **Destination Chain (Stellar)**: You must manually check and establish trustlines before executing operations

## StellarSpokeService Methods

The SDK provides three methods for managing Stellar trustlines:

### hasSufficientTrustline

Checks if a sufficient trustline exists for a given token and amount.

```typescript
import { StellarSpokeService } from "@sodax/sdk";

const hasTrustline = await StellarSpokeService.hasSufficientTrustline(
  tokenAddress,    // The Stellar token address
  amount,          // The amount you need to receive
  stellarSpokeProvider
);
```

**Returns:** `Promise<boolean>` - `true` if trustline exists and has sufficient limit, `false` otherwise

### walletHasSufficientTrustline

Checks if a specific Stellar wallet has a sufficient trustline for a given token and amount without requiring a `StellarSpokeProvider`.

```typescript
import { StellarSpokeService } from "@sodax/sdk";

const hasTrustline = await StellarSpokeService.walletHasSufficientTrustline(
  tokenAddress,    // The Stellar token address
  amount,          // The amount you need to receive
  walletAddress,   // The Stellar wallet address to check
  horizonRpcUrl    // Horizon RPC URL to query account balances
);
```

**Returns:** `Promise<boolean>` - `true` if trustline exists and has sufficient limit, `false` otherwise

### requestTrustline

Establishes a trustline for a given token.

```typescript
import { StellarSpokeService } from "@sodax/sdk";

const trustlineResult = await StellarSpokeService.requestTrustline(
  tokenAddress,    // The Stellar token address
  amount,          // The amount you need to receive (sets trustline limit)
  stellarSpokeProvider,
  false            // false = execute transaction, true = return raw transaction
);
```

**Returns:** Transaction hash or raw transaction data depending on the `raw` parameter

## Usage by Operation Type

### Swaps

For Stellar-based swap operations:

- **Source Chain (Stellar)**: Trustlines are automatically handled by `isAllowanceValid` and `approve` methods
- **Destination Chain (Stellar)**: You must manually establish trustlines before executing swaps

```typescript
import { StellarSpokeService } from "@sodax/sdk";

// When Stellar is the destination chain, check and establish trustlines
if (isStellarDestination) {
  // Check if sufficient trustline exists for the destination token
  const hasTrustline = await StellarSpokeService.hasSufficientTrustline(
    destinationTokenAddress,
    amount,
    stellarSpokeProvider
  );

  if (!hasTrustline) {
    // Request trustline for the destination token
    const trustlineResult = await StellarSpokeService.requestTrustline(
      destinationTokenAddress,
      amount,
      stellarSpokeProvider,
      false // false = execute transaction, true = return raw transaction
    );
    
    // Wait for trustline transaction to be confirmed before proceeding
    console.log('Trustline established:', trustlineResult);
  }
}
```

### Money Market

For Stellar-based money market operations:

- **Source Chain (Stellar)**: Trustlines are automatically handled by `isAllowanceValid` and `approve` methods
- **Destination Chain (Stellar)**: You must manually establish trustlines before executing money market actions

```typescript
import { StellarSpokeService } from "@sodax/sdk";

// When Stellar is the destination chain, check and establish trustlines
if (isStellarDestination) {
  // Check if sufficient trustline exists for the destination token
  const hasTrustline = await StellarSpokeService.hasSufficientTrustline(
    destinationTokenAddress,
    amount,
    stellarSpokeProvider
  );

  if (!hasTrustline) {
    // Request trustline for the destination token
    const trustlineResult = await StellarSpokeService.requestTrustline(
      destinationTokenAddress,
      amount,
      stellarSpokeProvider,
      false // false = execute transaction, true = return raw transaction
    );
    
    // Wait for trustline transaction to be confirmed before proceeding
    console.log('Trustline established:', trustlineResult);
  }
}
```

### Bridge

For Stellar-based bridge operations:

- **Source Chain (Stellar)**: Trustlines are automatically handled by `isAllowanceValid` and `approve` methods
- **Destination Chain (Stellar)**: You must manually establish trustlines before executing bridge operations

```typescript
import { StellarSpokeService } from "@sodax/sdk";

// When Stellar is the destination chain, check and establish trustlines
if (isStellarDestination) {
  // Check if sufficient trustline exists for the destination token
  const hasTrustline = await StellarSpokeService.hasSufficientTrustline(
    destinationTokenAddress,
    amount,
    stellarSpokeProvider
  );

  if (!hasTrustline) {
    // Request trustline for the destination token
    const trustlineResult = await StellarSpokeService.requestTrustline(
      destinationTokenAddress,
      amount,
      stellarSpokeProvider,
      false // false = execute transaction, true = return raw transaction
    );
    
    // Wait for trustline transaction to be confirmed before proceeding
    console.log('Trustline established:', trustlineResult);
  }
}
```

### Migration

For Stellar-based migration operations:

- **Source Chain (Stellar)**: Trustlines are automatically handled by `isAllowanceValid` and `approve` methods
- **Destination Chain (Stellar)**: You must manually establish trustlines before executing migration operations

```typescript
import { StellarSpokeService } from "@sodax/sdk";

// When Stellar is the destination chain, check and establish trustlines
if (isStellarDestination) {
  // Check if sufficient trustline exists for the destination token
  const hasTrustline = await StellarSpokeService.hasSufficientTrustline(
    destinationTokenAddress,
    amount,
    stellarSpokeProvider
  );

  if (!hasTrustline) {
    // Request trustline for the destination token
    const trustlineResult = await StellarSpokeService.requestTrustline(
      destinationTokenAddress,
      amount,
      stellarSpokeProvider,
      false // false = execute transaction, true = return raw transaction
    );
    
    // Wait for trustline transaction to be confirmed before proceeding
    console.log('Trustline established:', trustlineResult);
  }
}
```

### Staking

For Stellar-based staking operations:

- **Source Chain (Stellar)**: Trustlines are automatically handled by `isAllowanceValid` and `approve` methods
- **Note**: Staking operations always flow from spoke chains (including Stellar) to the hub chain (Sonic), so Stellar is only used as a source chain for staking operations

```typescript
import { StellarSpokeService } from "@sodax/sdk";

// When Stellar is the source chain, check and establish trustlines
if (isStellarSource) {
  // Check if sufficient trustline exists for the SODA token
  const hasTrustline = await StellarSpokeService.hasSufficientTrustline(
    sodaTokenAddress,
    amount,
    stellarSpokeProvider
  );

  if (!hasTrustline) {
    // Request trustline for the SODA token
    const trustlineResult = await StellarSpokeService.requestTrustline(
      sodaTokenAddress,
      amount,
      stellarSpokeProvider,
      false // false = execute transaction, true = return raw transaction
    );
    
    // Wait for trustline transaction to be confirmed before proceeding
    console.log('Trustline established:', trustlineResult);
  }
}
```

## Best Practices

1. **Always check trustlines before operations**: Use `hasSufficientTrustline` to verify trustline status before executing any operation where Stellar is the destination chain

2. **Set appropriate trustline limits**: When establishing a trustline, set the limit to at least the amount you expect to receive, with some buffer for safety

3. **Wait for confirmation**: Always wait for the trustline transaction to be confirmed before proceeding with the main operation

4. **Handle errors gracefully**: Trustline establishment can fail due to network issues or insufficient XLM balance (required for transaction fees)

5. **Reuse trustlines**: Once established, trustlines persist, so you don't need to recreate them for subsequent operations with the same token

## Common Patterns

### Complete Example: Swap with Stellar Destination

```typescript
import { StellarSpokeService } from "@sodax/sdk";

async function swapWithStellarDestination(
  swapParams: CreateIntentParams,
  stellarSpokeProvider: StellarSpokeProvider
): Promise<void> {
  // Step 1: Check and establish trustline if needed
  const hasTrustline = await StellarSpokeService.hasSufficientTrustline(
    swapParams.outputToken,
    swapParams.minOutputAmount,
    stellarSpokeProvider
  );

  if (!hasTrustline) {
    console.log('Establishing trustline...');
    const trustlineResult = await StellarSpokeService.requestTrustline(
      swapParams.outputToken,
      swapParams.minOutputAmount,
      stellarSpokeProvider,
      false
    );
    
    // Wait for confirmation
    await stellarSpokeProvider.walletProvider.waitForTransactionReceipt(trustlineResult);
    console.log('Trustline established successfully');
  }

  // Step 2: Proceed with swap operation
  const swapResult = await sodax.swaps.swap({
    intentParams: swapParams,
    spokeProvider: sourceSpokeProvider,
  });

  if (swapResult.ok) {
    console.log('Swap completed successfully');
  }
}
```

## Related Documentation

- [Swaps](./SWAPS.md) - Cross-chain intent-based swaps
- [Money Market](./MONEY_MARKET.md) - Cross-chain lending and borrowing
- [Bridge](./BRIDGE.md) - Cross-chain token bridging
- [Migration](./MIGRATION.md) - Token migration
- [Staking](./STAKING.md) - SODA token staking

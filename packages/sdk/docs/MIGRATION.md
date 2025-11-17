# Migration

Migration part of the SDK provides abstractions to assist you with migrating tokens between ICON and the hub chain (Sonic). The service supports multiple migration types including ICX/wICX → SODA, bnUSD legacy → new bnUSD, BALN → SODA, and their reverse operations.

## Using SDK Config and Constants

SDK includes predefined configurations of supported chains, tokens and other relevant information for the client to consume.

```typescript
import { 
  ICON_MAINNET_CHAIN_ID, 
  SONIC_MAINNET_CHAIN_ID,
  type HubChainId,
  type SpokeChainId 
} from "@sodax/sdk"

// Supported migration chains
const hubChainId: HubChainId = SONIC_MAINNET_CHAIN_ID;
const iconChainId: SpokeChainId = ICON_MAINNET_CHAIN_ID;

// Migration tokens
const migrationTokens = ['ICX', 'bnUSD', 'BALN'] as const;
```

Please refer to [SDK constants.ts](https://github.com/icon-project/sodax-frontend/blob/main/packages/types/src/constants/index.ts) for more.

### Initialising Providers

Refer to [Initialising Spoke Provider](../README.md#initialising-spoke-provider) section to see how IconSpokeProvider and SonicSpokeProvider can be created.

## Migration Types

The MigrationService supports multiple types of migrations:

1. **ICX/wICX → SODA**: Migrate ICX or wICX tokens from ICON to SODA tokens on the hub chain
2. **SODA → wICX**: Revert SODA tokens from the hub chain back to wICX tokens on ICON
3. **bnUSD Legacy ↔ New bnUSD**: Unified migration between legacy and new bnUSD tokens across supported chains
4. **BALN → SODA**: Migrate BALN tokens to SODA tokens on the hub chain

## Common Operations

### Check Allowance

Before creating migration intents, you should check if the allowance is valid. For forward migrations (ICX/wICX, bnUSD, BALN), no allowance is required as these tokens do not require approval.

**Note**: For Stellar-based operations, the allowance system works differently:
- **Source Chain (Stellar)**: The standard `isAllowanceValid` method works as expected for EVM chains, but for Stellar as the source chain, this method checks and establishes trustlines instead.
- **Destination Chain (Stellar)**: When Stellar is specified as the destination chain, frontends/clients need to manually check trustlines using `StellarSpokeService.hasSufficientTrustline` before executing migration operations.

```typescript
const sodax = new Sodax();

// For forward migration (no allowance required)
const migrationParams = {
  address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // wICX address
  amount: BigInt(1000000000000000000), // 1 ICX (18 decimals)
  to: '0x1234567890123456789012345678901234567890', // Recipient address on hub chain
} satisfies MigrationParams;

// Check if allowance is valid (always returns true for forward migrations)
const isAllowed = await sodax.migration.isAllowanceValid(
  migrationParams,
  'migrate',
  iconSpokeProvider
);

if (!isAllowed.ok) {
  console.error('Failed to check allowance:', isAllowed.error);
} else {
  console.log('Allowance is valid:', isAllowed.value);
}

// For reverse migration (SODA tokens require allowance check)
const revertParams = {
  amount: BigInt(1000000000000000000), // 1 SODA token (18 decimals)
  to: 'hx1234567890123456789012345678901234567890', // Icon address to receive wICX
} satisfies MigrationRevertParams;

// Check if allowance is valid for SODA tokens
const isAllowedRevert = await sodax.migration.isAllowanceValid(
  revertParams,
  'revert',
  sonicSpokeProvider
);

if (!isAllowedRevert.ok) {
  console.error('Failed to check allowance:', isAllowedRevert.error);
} else if (!isAllowedRevert.value) {
  console.log('Approval needed for SODA tokens');
} else {
  console.log('Allowance is valid');
}
```

### Approve Tokens

For reverse migrations, if the allowance check returns false, you need to approve the tokens before creating the revert migration intent.

**Note**: For Stellar-based operations, the approval system works differently:
- **Source Chain (Stellar)**: The standard `approve` method works as expected for EVM chains, but for Stellar as the source chain, this method establishes trustlines instead.
- **Destination Chain (Stellar)**: When Stellar is specified as the destination chain, frontends/clients need to manually establish trustlines using `StellarSpokeService.requestTrustline` before executing migration operations.

```typescript
const sodax = new Sodax();

const revertParams = {
  amount: BigInt(1000000000000000000),
  to: 'hx1234567890123456789012345678901234567890',
} satisfies MigrationRevertParams;

// Approve SODA tokens for reverse migration
const approveResult = await sodax.migration.approve(
  revertParams,
  'revert',
  sonicSpokeProvider,
  false // Optional raw flag
);

if (approveResult.ok) {
  console.log('Approval transaction hash:', approveResult.value);
  // Wait for approval transaction to be mined
  const approveTxResult = await sonicSpokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
  console.log('Approval transaction confirmed:', approveTxResult);
} else {
  console.error('Failed to approve tokens:', approveResult.error);
}
```

### Stellar Trustline Requirements

For Stellar-based migration operations, you need to handle trustlines differently depending on whether Stellar is the source or destination chain. See [Stellar Trustline Requirements](./STELLAR_TRUSTLINE.md#migration) for detailed information and code examples.

## ICX Migration (ICX/wICX → SODA)

### Migrate ICX to SODA

Migrate ICX or wICX tokens to SODA tokens on the hub chain.

```typescript
const sodax = new Sodax();

const migrationParams = {
  address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // wICX address
  amount: BigInt(1000000000000000000), // 1 ICX (18 decimals)
  to: '0x1234567890123456789012345678901234567890', // Recipient address on hub chain
} satisfies IcxMigrateParams;

// Migrate ICX to SODA
const result = await sodax.migration.migrateIcxToSoda(
  migrationParams,
  iconSpokeProvider,
  30000 // Optional timeout in milliseconds (default: 60000)
);

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('ICX migration successful!');
  console.log('Spoke transaction hash:', spokeTxHash);
  console.log('Hub transaction hash:', hubTxHash);
} else {
  console.error('ICX migration failed:', result.error);
}
```

## Reverse ICX Migration (SODA → wICX)

### Revert SODA to ICX

Revert SODA tokens back to wICX tokens on ICON.

```typescript
const sodax = new Sodax();

const revertParams = {
  amount: BigInt(1000000000000000000), // 1 SODA token (18 decimals)
  to: 'hx1234567890123456789012345678901234567890', // Icon address to receive wICX
} satisfies IcxCreateRevertMigrationParams;

// Revert SODA to ICX
const result = await sodax.migration.revertMigrateSodaToIcx(
  revertParams,
  sonicSpokeProvider,
  30000 // Optional timeout in milliseconds (default: 60000)
);

if (result.ok) {
  const [hubTxHash, spokeTxHash] = result.value;
  console.log('SODA to ICX revert successful!');
  console.log('Hub transaction hash:', hubTxHash);
  console.log('Spoke transaction hash:', spokeTxHash);
} else {
  console.error('SODA to ICX revert failed:', result.error);
}
```

## bnUSD Migration (Legacy ↔ New bnUSD)

The bnUSD migration now uses a unified API that handles both forward (legacy → new) and reverse (new → legacy) migrations. The system automatically determines the migration direction based on the token addresses provided.

### bnUSD Constants and Helper Functions

The SDK provides several constants and helper functions to work with legacy and new bnUSD tokens across different chains:

```typescript
import {
  bnUSDLegacySpokeChainIds,
  newbnUSDSpokeChainIds,
  bnUSDLegacyTokens,
  bnUSDNewTokens,
  isLegacybnUSDChainId,
  isNewbnUSDChainId,
  isLegacybnUSDToken,
  isNewbnUSDToken,
  getAllLegacybnUSDTokens,
} from '@sodax/sdk';

// Get all chains that support legacy bnUSD
console.log('Legacy bnUSD chains:', bnUSDLegacySpokeChainIds);
// Output: ['0x1.icon', 'sui', 'stellar']

// Get all chains that support new bnUSD
console.log('New bnUSD chains:', newbnUSDSpokeChainIds);
// Output: ['sonic', 'arbitrum', 'base', 'polygon', ...] (all chains except Icon)

// Get all legacy bnUSD token configurations
console.log('Legacy bnUSD tokens:', bnUSDLegacyTokens);
// Output: Array of token objects with address, symbol, name, decimals

// Get all new bnUSD token configurations
console.log('New bnUSD tokens:', bnUSDNewTokens);
// Output: Array of token objects with address, symbol, name, decimals

// Check if a chain supports legacy bnUSD
const isLegacyChain = isLegacybnUSDChainId('0x1.icon'); // true
const isNewChain = isNewbnUSDChainId('sonic'); // true

// Check if a token address is legacy bnUSD
const isLegacyToken = isLegacybnUSDToken('cx88fd7df7ddff82f7cc735c871dc519838cb235bb'); // true
const isNewToken = isNewbnUSDToken('0xE801CA34E19aBCbFeA12025378D19c4FBE250131'); // true

// Get all legacy bnUSD tokens with their chain information
const allLegacyTokens = getAllLegacybnUSDTokens();
// Output: [
//   { token: { address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', ... }, chainId: '0x1.icon' },
//   { token: { address: '0x...', ... }, chainId: 'sui' },
//   { token: { address: '0x...', ... }, chainId: 'stellar' }
// ]
```

### Migrate Legacy bnUSD to New bnUSD

Migrate legacy bnUSD tokens to new bnUSD tokens on any spoke chain (besides Icon - which has only legacy bnUSD).

**Note**: When migrating to Stellar as the destination chain, ensure you have established the necessary trustlines using `StellarSpokeService.hasSufficientTrustline` and `StellarSpokeService.requestTrustline` before executing the migration.

```typescript
const sodax = new Sodax();

const migrationParams = {
  srcChainId: '0x1.icon', // Source chain ID (ICON)
  dstChainId: 'sonic', // Destination chain ID (spoke chain)
  srcbnUSD: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // Legacy bnUSD address
  dstbnUSD: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // New bnUSD address
  amount: BigInt(1000000000000000000), // 1 bnUSD (18 decimals)
  to: '0x1234567890123456789012345678901234567890', // Recipient address on hub chain
} satisfies UnifiedBnUSDMigrateParams;

// Migrate legacy bnUSD to new bnUSD
const result = await sodax.migration.migratebnUSD(
  migrationParams,
  iconSpokeProvider,
  30000 // Optional timeout in milliseconds (default: 60000)
);

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('bnUSD migration successful!');
  console.log('Spoke transaction hash:', spokeTxHash);
  console.log('Hub transaction hash:', hubTxHash);
} else {
  console.error('bnUSD migration failed:', result.error);
}
```

### Reverse Migrate New bnUSD to Legacy bnUSD

Revert new bnUSD tokens back to legacy bnUSD tokens. Legacy bnUSD exists on Icon, Sui or Stellar chains.

**Note**: When migrating to Stellar as the destination chain, ensure you have established the necessary trustlines using `StellarSpokeService.hasSufficientTrustline` and `StellarSpokeService.requestTrustline` before executing the migration.

```typescript
const sodax = new Sodax();

const revertParams = {
  srcChainId: 'sonic', // Source chain ID (any spoke chain besides Icon)
  dstChainId: '0x1.icon', // Destination chain ID (ICON) where legacy bnUSD exists (Sui, Stellar or Icon)
  srcbnUSD: '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // New bnUSD address
  dstbnUSD: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // Legacy bnUSD address
  amount: BigInt(1000000000000000000), // 1 new bnUSD (18 decimals)
  to: 'hx1234567890123456789012345678901234567890', // Recipient address on spoke chain
} satisfies UnifiedBnUSDMigrateParams;

// Check allowance for reverse migration
const isAllowed = await sodax.migration.isAllowanceValid(
  revertParams,
  'revert',
  sonicSpokeProvider
);

if (!isAllowed.ok) {
  console.error('Failed to check allowance:', isAllowed.error);
} else if (!isAllowed.value) {
  // Approve if needed
  const approveResult = await sodax.migration.approve(
    revertParams,
    'revert',
    sonicSpokeProvider
  );
  
  if (approveResult.ok) {
    console.log('Approval transaction hash:', approveResult.value);
    // Wait for approval transaction to be mined
    await sonicSpokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
  } else {
    console.error('Failed to approve tokens:', approveResult.error);
    return;
  }
}

// Reverse migrate new bnUSD to legacy bnUSD
const result = await sodax.migration.migratebnUSD(
  revertParams,
  sonicSpokeProvider,
  30000 // Optional timeout in milliseconds (default: 60000)
);

if (result.ok) {
  const [hubTxHash, spokeTxHash] = result.value;
  console.log('bnUSD reverse migration successful!');
  console.log('Hub transaction hash:', hubTxHash);
  console.log('Spoke transaction hash:', spokeTxHash);
} else {
  console.error('bnUSD reverse migration failed:', result.error);
}
```

## BALN Migration (BALN → SODA)

### Migrate BALN to SODA

Migrate BALN tokens to SODA tokens on the hub chain.

```typescript
const sodax = new Sodax();

const migrationParams = {
  amount: BigInt(1000000000000000000), // 1 BALN (18 decimals)
  lockupPeriod: 'SIX_MONTHS', // Lockup period for the swap
  to: '0x1234567890123456789012345678901234567890', // Recipient address on hub chain
  stake: true, // Whether to stake the SODA tokens
} satisfies BalnMigrateParams;

// Migrate BALN to SODA
const result = await sodax.migration.migrateBaln(
  migrationParams,
  iconSpokeProvider,
  30000 // Optional timeout in milliseconds (default: 60000)
);

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('BALN migration successful!');
  console.log('Spoke transaction hash:', spokeTxHash);
  console.log('Hub transaction hash:', hubTxHash);
} else {
  console.error('BALN migration failed:', result.error);
}
```

## Complete Examples

### ICX Migration Example

```typescript
const sodax = new Sodax();

async function migrateIcx(amount: bigint, recipient: Address): Promise<void> {
  const params = {
    address: iconSpokeProvider.chainConfig.addresses.wICX,
    amount,
    to: recipient,
  } satisfies IcxMigrateParams;

  const result = await sodax.migration.migrateIcxToSoda(params, iconSpokeProvider);

  if (result.ok) {
    const [spokeTxHash, hubTxHash] = result.value;
    console.log('[migrateIcx] Migration successful!');
    console.log('[migrateIcx] Spoke transaction hash:', spokeTxHash);
    console.log('[migrateIcx] Hub transaction hash:', hubTxHash);
  } else {
    console.error('[migrateIcx] Migration failed:', result.error);
  }
}

// Usage
await migrateIcx(BigInt(1000000000000000000), '0x1234567890123456789012345678901234567890');
```

### Reverse ICX Migration Example

```typescript
const sodax = new Sodax();

async function reverseMigrateIcx(amount: bigint, to: IconEoaAddress): Promise<void> {
  const params = {
    amount,
    to,
  } satisfies IcxCreateRevertMigrationParams;

  // Check allowance
  const isAllowed = await sodax.migration.isAllowanceValid(params, 'revert', sonicSpokeProvider);

  if (!isAllowed.ok) {
    console.error('[reverseMigrateIcx] Allowance check failed:', isAllowed.error);
    return;
  }

  if (!isAllowed.value) {
    // Approve if needed
    const approveResult = await sodax.migration.approve(params, 'revert', sonicSpokeProvider);
    if (approveResult.ok) {
      console.log('[reverseMigrateIcx] Approval hash:', approveResult.value);
      const approveTxResult = await sonicSpokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[reverseMigrateIcx] Approval confirmed:', approveTxResult);
    } else {
      console.error('[reverseMigrateIcx] Approval failed:', approveResult.error);
      return;
    }
  }

  // Create and submit revert migration intent
  const result = await sodax.migration.revertMigrateSodaToIcx(params, sonicSpokeProvider);

  if (result.ok) {
    const [hubTxHash, spokeTxHash] = result.value;
    console.log('[reverseMigrateIcx] Revert migration successful!');
    console.log('[reverseMigrateIcx] Hub transaction hash:', hubTxHash);
    console.log('[reverseMigrateIcx] Spoke transaction hash:', spokeTxHash);
  } else {
    console.error('[reverseMigrateIcx] Revert migration failed:', result.error);
  }
}

// Usage
await reverseMigrateIcx(BigInt(1000000000000000000), 'hx1234567890123456789012345678901234567890');
```

### bnUSD Migration Example

```typescript
const sodax = new Sodax();

async function migrateBnUSD(
  amount: bigint, 
  recipient: Address, 
  legacybnUSD: string, 
  newbnUSD: string, 
  dstChainId: SpokeChainId
): Promise<void> {
  const params = {
    srcChainId: '0x1.icon', // Source chain ID (ICON)
    dstChainId: dstChainId,
    srcbnUSD: legacybnUSD, // Legacy bnUSD address
    dstbnUSD: newbnUSD, // New bnUSD address
    amount,
    to: recipient,
  } satisfies UnifiedBnUSDMigrateParams;

  const result = await sodax.migration.migratebnUSD(params, iconSpokeProvider);

  if (result.ok) {
    const [spokeTxHash, hubTxHash] = result.value;
    console.log('[migrateBnUSD] Migration successful!');
    console.log('[migrateBnUSD] Spoke transaction hash:', spokeTxHash);
    console.log('[migrateBnUSD] Hub transaction hash:', hubTxHash);
  } else {
    console.error('[migrateBnUSD] Migration failed:', result.error);
  }
}

// Usage - Forward migration (legacy to new)
await migrateBnUSD(
  BigInt(1000000000000000000), 
  '0x1234567890123456789012345678901234567890',
  'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // Legacy bnUSD
  '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // New bnUSD
  'sonic' // Destination chain
);

// Usage - Reverse migration (new to legacy)
await migrateBnUSD(
  BigInt(1000000000000000000), 
  'hx1234567890123456789012345678901234567890',
  '0xE801CA34E19aBCbFeA12025378D19c4FBE250131', // New bnUSD
  'cx88fd7df7ddff82f7cc735c871dc519838cb235bb', // Legacy bnUSD
  '0x1.icon' // Destination chain
);
```

### BALN Migration Example

```typescript
const sodax = new Sodax();

async function migrateBaln(amount: bigint, recipient: Address): Promise<void> {
  const params = {
    amount,
    lockupPeriod: 'SIX_MONTHS',
    to: recipient,
    stake: true,
  } satisfies BalnMigrateParams;

  const result = await sodax.migration.migrateBaln(params, iconSpokeProvider);

  if (result.ok) {
    const [spokeTxHash, hubTxHash] = result.value;
    console.log('[migrateBaln] Migration successful!');
    console.log('[migrateBaln] Spoke transaction hash:', spokeTxHash);
    console.log('[migrateBaln] Hub transaction hash:', hubTxHash);
  } else {
    console.error('[migrateBaln] Migration failed:', result.error);
  }
}

// Usage
await migrateBaln(BigInt(1000000000000000000), '0x1234567890123456789012345678901234567890');
```

## Error Handling

The MigrationService returns `Result` types that can contain various error codes:

- `MIGRATION_FAILED`: General migration failure
- `CREATE_MIGRATION_INTENT_FAILED`: Failed to create migration intent
- `CREATE_REVERT_MIGRATION_INTENT_FAILED`: Failed to create revert migration intent
- `REVERT_MIGRATION_FAILED`: General revert migration failure
- `RelayError`: Errors from the relay service

Each error includes the original parameters and the underlying error for debugging purposes.

## Configuration

The MigrationService can be configured with custom relay API endpoints and timeouts:

```typescript
import { MigrationService, DEFAULT_RELAYER_API_ENDPOINT } from '@sodax/sdk';

const migrationService = new MigrationService(hubProvider, {
  relayerApiEndpoint: 'https://custom-relay-api.example.com',
});
```

Default configuration:
- `relayerApiEndpoint`: `https://relay.soniclabs.com`
- `timeout`: 60000ms (60 seconds)
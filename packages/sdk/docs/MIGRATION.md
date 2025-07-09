# Migration

Migration part of the SDK provides abstractions to assist you with migrating tokens between ICON and the hub chain (Sonic). The service supports both forward migration (ICX/wICX → SODA) and reverse migration (SODA → wICX).

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
const migrationTokens = ['ICX'] as const;
```

Please refer to [SDK constants.ts](https://github.com/icon-project/sodax-frontend/blob/main/packages/sdk/src/constants.ts) for more.

### Initialising Providers

Refer to [Initialising Spoke Provider](../README.md#initialising-spoke-provider) section to see how IconSpokeProvider and SonicSpokeProvider can be created.

## Migration Types

The MigrationService supports two types of migrations:

1. **Forward Migration (ICX/wICX → SODA)**: Migrate ICX or wICX tokens from ICON to SODA tokens on the hub chain
2. **Reverse Migration (SODA → wICX)**: Revert SODA tokens from the hub chain back to wICX tokens on ICON

## Forward Migration (ICX/wICX → SODA)

### Check Allowance

Before creating a migration intent, you should check if the allowance is valid. For ICX migration, no allowance is required as ICX and wICX do not require allowance.

```typescript
import {
  Sodax,
  IconSpokeProvider,
  type MigrationParams,
  type Result
} from "@sodax/sdk";

const migrationParams = {
  token: 'ICX',
  icx: iconSpokeChainConfig.nativeToken, // Native ICX token address
  amount: BigInt(1000000000000000000), // 1 ICX (18 decimals)
  to: '0x1234567890123456789012345678901234567890', // Recipient address on hub chain
  action: 'migrate',
} satisfies MigrationParams;

// Check if allowance is valid (always returns true for ICX)
const isAllowed = await sodax.migration.isAllowanceValid(
  migrationParams,
  iconSpokeProvider
);

if (!isAllowed.ok) {
  console.error('Failed to check allowance:', isAllowed.error);
} else {
  console.log('Allowance is valid:', isAllowed.value);
}
```

### Create and Submit Migration Intent

Create and submit a migration intent to migrate ICX/wICX tokens to SODA tokens on the hub chain.

```typescript
import {
  Sodax,
  IconSpokeProvider,
  type MigrationParams,
  type Result,
  type Hex
} from "@sodax/sdk";

const migrationParams = {
  token: 'ICX',
  icx: iconSpokeChainConfig.nativeToken, // Native ICX token address
  amount: BigInt(1000000000000000000), // 1 ICX (18 decimals)
  to: '0x1234567890123456789012345678901234567890', // Recipient address on hub chain
  action: 'migrate',
} satisfies MigrationParams;

// Create and submit migration intent
const result = await sodax.migration.createAndSubmitMigrateIntent(
  migrationParams,
  iconSpokeProvider,
  30000 // Optional timeout in milliseconds (default: 60000)
);

if (result.ok) {
  const [spokeTxHash, hubTxHash] = result.value;
  console.log('Migration successful!');
  console.log('Spoke transaction hash:', spokeTxHash);
  console.log('Hub transaction hash:', hubTxHash);
} else {
  console.error('Migration failed:', result.error);
}
```

### Create Migration Intent Only

If you want to create the migration intent without automatically submitting it to the relay:

```typescript
import {
  Sodax,
  IconSpokeProvider,
  type MigrationParams,
  type Result
} from "@sodax/sdk";

const migrationParams = {
  token: 'ICX',
  icx: iconSpokeChainConfig.nativeToken,
  amount: BigInt(1000000000000000000),
  to: '0x1234567890123456789012345678901234567890',
  action: 'migrate',
} satisfies MigrationParams;

// Create migration intent only
const result = await sodax.migration.createMigrateIntent(
  migrationParams,
  iconSpokeProvider,
  true // Optional raw flag to return raw transaction
);

if (result.ok) {
  console.log('Migration intent created:', result.value);
  // You can now manually relay the transaction using relayTxAndWaitPacket
} else {
  console.error('Failed to create migration intent:', result.error);
}
```

## Reverse Migration (SODA → wICX)

### Check Allowance

Before creating a revert migration intent, you need to check if the SODA token allowance is valid.

```typescript
import {
  Sodax,
  SonicSpokeProvider,
  type IcxCreateRevertMigrationParams,
  type Result
} from "@sodax/sdk";

const revertParams = {
  amount: BigInt(1000000000000000000), // 1 SODA token (18 decimals)
  to: 'hx1234567890123456789012345678901234567890', // Icon address to receive wICX
  action: 'revert',
} satisfies IcxCreateRevertMigrationParams;

// Check if allowance is valid
const isAllowed = await sodax.migration.isAllowanceValid(
  revertParams,
  sonicSpokeProvider
);

if (!isAllowed.ok) {
  console.error('Failed to check allowance:', isAllowed.error);
} else if (!isAllowed.value) {
  console.log('Approval needed for SODA tokens');
} else {
  console.log('Allowance is valid');
}
```

### Approve SODA Tokens

If the allowance check returns false, you need to approve the SODA tokens before creating the revert migration intent.

```typescript
import {
  Sodax,
  SonicSpokeProvider,
  type IcxCreateRevertMigrationParams,
  type Result
} from "@sodax/sdk";

const revertParams = {
  amount: BigInt(1000000000000000000),
  to: 'hx1234567890123456789012345678901234567890',
  action: 'revert',
} satisfies IcxCreateRevertMigrationParams;

// Approve SODA tokens
const approveResult = await sodax.migration.approve(
  revertParams,
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

### Create and Submit Revert Migration Intent

Create and submit a revert migration intent to convert SODA tokens back to wICX tokens on ICON.

```typescript
import {
  Sodax,
  SonicSpokeProvider,
  type IcxCreateRevertMigrationParams,
  type Result,
  type Hex
} from "@sodax/sdk";

const revertParams = {
  amount: BigInt(1000000000000000000), // 1 SODA token (18 decimals)
  to: 'hx1234567890123456789012345678901234567890', // Icon address to receive wICX
  action: 'revert',
} satisfies IcxCreateRevertMigrationParams;

// Create and submit revert migration intent
const result = await sodax.migration.createAndSubmitRevertMigrationIntent(
  revertParams,
  sonicSpokeProvider,
  30000 // Optional timeout in milliseconds (default: 60000)
);

if (result.ok) {
  const [hubTxHash, spokeTxHash] = result.value;
  console.log('Revert migration successful!');
  console.log('Hub transaction hash:', hubTxHash);
  console.log('Spoke transaction hash:', spokeTxHash);
} else {
  console.error('Revert migration failed:', result.error);
}
```

### Create Revert Migration Intent Only

If you want to create the revert migration intent without automatically submitting it to the relay:

```typescript
import {
  Sodax,
  SonicSpokeProvider,
  type IcxCreateRevertMigrationParams,
  type Result
} from "@sodax/sdk";

const revertParams = {
  amount: BigInt(1000000000000000000),
  to: 'hx1234567890123456789012345678901234567890',
  action: 'revert',
} satisfies IcxCreateRevertMigrationParams;

// Create revert migration intent only
const result = await sodax.migration.createRevertMigrationIntent(
  revertParams,
  sonicSpokeProvider,
  true // Optional raw flag to return raw transaction
);

if (result.ok) {
  console.log('Revert migration intent created:', result.value);
  // You can now manually relay the transaction using relayTxAndWaitPacket
} else {
  console.error('Failed to create revert migration intent:', result.error);
}
```

## Complete Examples

### Forward Migration Example (ICX/wICX → SODA)

```typescript
import 'dotenv/config';
import type { Address, Hex } from 'viem';
import {
  EvmHubProvider,
  IconSpokeProvider,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  ICON_MAINNET_CHAIN_ID,
  type EvmHubProviderConfig,
  type SodaxConfig,
  Sodax,
  spokeChainConfig,
  type MigrationParams,
} from '@sodax/sdk';
import { IconWalletProvider } from './wallet-providers/IconWalletProvider.js';

// Setup providers
const privateKey = process.env.PRIVATE_KEY as Hex;
const iconSpokeWallet = new IconWalletProvider({
  privateKey,
  rpcUrl: 'https://ctz.solidwallet.io/api/v3',
});
const iconSpokeProvider = new IconSpokeProvider(iconSpokeWallet, spokeChainConfig[ICON_MAINNET_CHAIN_ID]);

const hubConfig = {
  hubRpcUrl: 'https://rpc.soniclabs.com',
  chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const sodax = new Sodax({
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

async function migrate(amount: bigint, recipient: Address): Promise<void> {
  const params = {
    token: 'ICX',
    icx: iconSpokeProvider.chainConfig.nativeToken,
    amount,
    to: recipient,
    action: 'migrate',
  } satisfies MigrationParams;

  const result = await sodax.migration.createAndSubmitMigrateIntent(params, iconSpokeProvider);

  if (result.ok) {
    const [spokeTxHash, hubTxHash] = result.value;
    console.log('[migrate] Migration successful!');
    console.log('[migrate] Spoke transaction hash:', spokeTxHash);
    console.log('[migrate] Hub transaction hash:', hubTxHash);
  } else {
    console.error('[migrate] Migration failed:', result.error);
  }
}

// Usage
await migrate(BigInt(1000000000000000000), '0x1234567890123456789012345678901234567890');
```

### Reverse Migration Example (SODA → wICX)

```typescript
import 'dotenv/config';
import type { Hex } from 'viem';
import {
  EvmHubProvider,
  SonicSpokeProvider,
  getHubChainConfig,
  SONIC_MAINNET_CHAIN_ID,
  type EvmHubProviderConfig,
  type SodaxConfig,
  Sodax,
  spokeChainConfig,
  type IcxCreateRevertMigrationParams,
  type IconEoaAddress,
} from '@sodax/sdk';
import { EvmWalletProvider } from './wallet-providers/EvmWalletProvider.js';

// Setup providers
const privateKey = process.env.PRIVATE_KEY as Hex;
const spokeEvmWallet = new EvmWalletProvider(privateKey, SONIC_MAINNET_CHAIN_ID, 'https://rpc.soniclabs.com');
const sonicSpokeProvider = new SonicSpokeProvider(spokeEvmWallet, spokeChainConfig[SONIC_MAINNET_CHAIN_ID]);

const hubConfig = {
  hubRpcUrl: 'https://rpc.soniclabs.com',
  chainConfig: getHubChainConfig(SONIC_MAINNET_CHAIN_ID),
} satisfies EvmHubProviderConfig;

const sodax = new Sodax({
  hubProviderConfig: hubConfig,
} satisfies SodaxConfig);

async function reverseMigrate(amount: bigint, to: IconEoaAddress): Promise<void> {
  const params = {
    amount,
    to,
    action: 'revert',
  } satisfies IcxCreateRevertMigrationParams;

  // Check allowance
  const isAllowed = await sodax.migration.isAllowanceValid(params, sonicSpokeProvider);

  if (!isAllowed.ok) {
    console.error('[reverseMigrate] Allowance check failed:', isAllowed.error);
    return;
  }

  if (!isAllowed.value) {
    // Approve if needed
    const approveResult = await sodax.migration.approve(params, sonicSpokeProvider);
    if (approveResult.ok) {
      console.log('[reverseMigrate] Approval hash:', approveResult.value);
      const approveTxResult = await sonicSpokeProvider.walletProvider.waitForTransactionReceipt(approveResult.value);
      console.log('[reverseMigrate] Approval confirmed:', approveTxResult);
    } else {
      console.error('[reverseMigrate] Approval failed:', approveResult.error);
      return;
    }
  }

  // Create and submit revert migration intent
  const result = await sodax.migration.createAndSubmitRevertMigrationIntent(params, sonicSpokeProvider);

  if (result.ok) {
    const [hubTxHash, spokeTxHash] = result.value;
    console.log('[reverseMigrate] Revert migration successful!');
    console.log('[reverseMigrate] Hub transaction hash:', hubTxHash);
    console.log('[reverseMigrate] Spoke transaction hash:', spokeTxHash);
  } else {
    console.error('[reverseMigrate] Revert migration failed:', result.error);
  }
}

// Usage
await reverseMigrate(BigInt(1000000000000000000), 'hx1234567890123456789012345678901234567890');
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
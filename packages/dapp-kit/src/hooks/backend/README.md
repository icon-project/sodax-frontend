# Backend API Hooks

This directory contains React hooks for interacting with the Sodax Backend API through the `BackendApiService`. These hooks provide a React-friendly interface with automatic caching, error handling, and loading states using React Query.

## Available Hooks

### Intent Hooks

#### `useIntentByTxHash(txHash: string | undefined)`
Fetches intent details by transaction hash.

```typescript
import { useIntentByTxHash } from '@sodax/dapp-kit';

const { data: intent, isLoading, error } = useIntentByTxHash('0x123...');
```

#### `useIntentByHash(intentHash: string | undefined)`
Fetches intent details by intent hash.

```typescript
import { useIntentByHash } from '@sodax/dapp-kit';

const { data: intent, isLoading, error } = useIntentByHash('0xabc...');
```

### Solver Hooks

#### `useOrderbook(params: { offset: string; limit: string } | undefined)`
Fetches the solver orderbook with pagination support.

```typescript
import { useOrderbook } from '@sodax/dapp-kit';

const { data: orderbook, isLoading, error } = useOrderbook({
  offset: '0',
  limit: '10'
});
```

### Money Market Hooks

#### `useMoneyMarketPosition(userAddress: string | undefined)`
Fetches a user's money market positions.

```typescript
import { useMoneyMarketPosition } from '@sodax/dapp-kit';

const { data: position, isLoading, error } = useMoneyMarketPosition('0x123...');
```

#### `useAllMoneyMarketAssets()`
Fetches all available money market assets.

```typescript
import { useAllMoneyMarketAssets } from '@sodax/dapp-kit';

const { data: assets, isLoading, error } = useAllMoneyMarketAssets();
```

#### `useMoneyMarketAsset(reserveAddress: string | undefined)`
Fetches details for a specific money market asset.

```typescript
import { useMoneyMarketAsset } from '@sodax/dapp-kit';

const { data: asset, isLoading, error } = useMoneyMarketAsset('0xabc...');
```

#### `useMoneyMarketAssetBorrowers(params)`
Fetches borrowers for a specific money market asset.

```typescript
import { useMoneyMarketAssetBorrowers } from '@sodax/dapp-kit';

const { data: borrowers, isLoading, error } = useMoneyMarketAssetBorrowers({
  reserveAddress: '0xabc...',
  offset: '0',
  limit: '20'
});
```

#### `useMoneyMarketAssetSuppliers(params)`
Fetches suppliers for a specific money market asset.

```typescript
import { useMoneyMarketAssetSuppliers } from '@sodax/dapp-kit';

const { data: suppliers, isLoading, error } = useMoneyMarketAssetSuppliers({
  reserveAddress: '0xabc...',
  offset: '0',
  limit: '20'
});
```

#### `useAllMoneyMarketBorrowers(params)`
Fetches all money market borrowers across all assets.

```typescript
import { useAllMoneyMarketBorrowers } from '@sodax/dapp-kit';

const { data: borrowers, isLoading, error } = useAllMoneyMarketBorrowers({
  offset: '0',
  limit: '50'
});
```

## Features

- **Automatic Caching**: All hooks use React Query for efficient data caching
- **Error Handling**: Built-in error states and retry logic
- **Loading States**: Automatic loading indicators
- **TypeScript Support**: Full type safety with proper TypeScript definitions
- **Pagination Support**: Built-in pagination for list endpoints
- **Conditional Queries**: Queries are automatically disabled when required parameters are missing
- **Context Integration**: Uses `useSodaxContext` for consistent SDK access across the application

## Stale Times

Different hooks have different stale times optimized for their data types:


## Error Handling

All hooks return standard React Query result objects with:

- `data`: The fetched data (undefined when loading or on error)
- `isLoading`: Boolean indicating if the request is in progress
- `error`: Error object if the request failed
- `refetch`: Function to manually trigger a data refresh

## Requirements

- **SodaxProvider**: All backend hooks require the app to be wrapped with `SodaxProvider` from `@sodax/dapp-kit`
- **React Query**: The hooks use React Query for state management and caching

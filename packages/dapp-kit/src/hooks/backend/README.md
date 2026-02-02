# Backend API Hooks

This directory contains React hooks for interacting with the Sodax Backend API through the `BackendApiService`. These hooks provide a React-friendly interface with automatic caching, error handling, and loading states using React Query.

## Available Hooks

### Intent Hooks

#### `useBackendIntentByTxHash(params)`

Fetches intent details by transaction hash. The query is disabled if `txHash` is undefined or empty.

```typescript
import { useBackendIntentByTxHash } from '@sodax/dapp-kit';

const { data: intent, isLoading, error } = useBackendIntentByTxHash({
  params: { txHash: '0x123...' },
  queryOptions: { staleTime: 1000 }, // optional
});
```

**Parameters:**

- `params.params.txHash` (string | undefined): Transaction hash used to retrieve the associated intent
- `params.queryOptions` (optional): React Query options to customize behavior

**Note:** Intents are only created on the hub chain, so `txHash` must originate from there. Default refetch interval is 1 second.

#### `useBackendIntentByHash(params)`

Fetches intent details by intent hash. The query is disabled if `intentHash` is undefined or empty.

```typescript
import { useBackendIntentByHash } from '@sodax/dapp-kit';

const { data: intent, isLoading, error } = useBackendIntentByHash({
  params: { intentHash: '0xabc...' },
});
```

**Parameters:**

- `params.params.intentHash` (string | undefined): The hash identifying the intent to fetch
- `params.queryOptions` (optional): React Query options to customize behavior

#### `useBackendUserIntents(params)`

Fetches user-created intents from the backend API for a given user address, with optional date filtering.

```typescript
import { useBackendUserIntents } from '@sodax/dapp-kit';

const { data: userIntents, isLoading, error } = useBackendUserIntents({
  params: {
    userAddress: '0x123...',
    startDate: Date.now() - 1_000_000, // optional
    endDate: Date.now(), // optional
  },
});
```

**Parameters:**

- `params.params.userAddress` (Address): The wallet address of the user (required)
- `params.params.startDate` (number, optional): Include intents created after this timestamp (ms)
- `params.params.endDate` (number, optional): Include intents created before this timestamp (ms)
- `params.queryOptions` (optional): React Query options to customize behavior
- `params.pagination` (optional): Currently ignored

### Solver Hooks

#### `useBackendOrderbook(params)`

Fetches the solver orderbook with pagination support. The query is disabled if pagination parameters are missing.

```typescript
import { useBackendOrderbook } from '@sodax/dapp-kit';

const { data: orderbook, isLoading, error } = useBackendOrderbook({
  pagination: { offset: '0', limit: '10' },
  queryOptions: { staleTime: 60000 }, // optional
});
```

**Parameters:**

- `params.pagination.offset` (string): The offset for pagination (required)
- `params.pagination.limit` (string): The limit for pagination (required)
- `params.queryOptions` (optional): React Query options to customize behavior

**Note:** Default `staleTime` is 30 seconds to support near-real-time updates.

### Money Market Hooks

#### `useBackendMoneyMarketPosition(params)`

Fetches a user's money market position. The query is disabled if `userAddress` is undefined or empty.

```typescript
import { useBackendMoneyMarketPosition } from '@sodax/dapp-kit';

const { data: position, isLoading, error } = useBackendMoneyMarketPosition({
  userAddress: '0x123...',
  queryOptions: { staleTime: 60000 }, // optional
});
```

**Parameters:**

- `params.userAddress` (string | undefined): The user's wallet address to fetch positions for
- `params.queryOptions` (optional): React Query options to customize behavior

#### `useBackendAllMoneyMarketAssets(params)`

Fetches all available money market assets. No required parameters.

```typescript
import { useBackendAllMoneyMarketAssets } from '@sodax/dapp-kit';

const { data: assets, isLoading, error } = useBackendAllMoneyMarketAssets({
  queryOptions: { staleTime: 60000 }, // optional
});
```

**Parameters:**

- `params.queryOptions` (optional): React Query options to customize behavior

#### `useBackendMoneyMarketAsset(params)`

Fetches details for a specific money market asset. The query is disabled if `reserveAddress` is undefined or empty.

```typescript
import { useBackendMoneyMarketAsset } from '@sodax/dapp-kit';

const { data: asset, isLoading, error } = useBackendMoneyMarketAsset({
  params: { reserveAddress: '0xabc...' },
});
```

**Parameters:**

- `params.params.reserveAddress` (string | undefined): Reserve contract address to fetch asset details
- `params.queryOptions` (optional): React Query options to customize behavior

#### `useBackendMoneyMarketAssetBorrowers(params)`

Fetches borrowers for a specific money market asset with pagination. The query is disabled if `reserveAddress`, `offset`, or `limit` are missing.

```typescript
import { useBackendMoneyMarketAssetBorrowers } from '@sodax/dapp-kit';

const { data: borrowers, isLoading, error } = useBackendMoneyMarketAssetBorrowers({
  params: { reserveAddress: '0xabc...' },
  pagination: { offset: '0', limit: '20' },
});
```

**Parameters:**

- `params.params.reserveAddress` (string | undefined): Reserve contract address for which to fetch borrowers
- `params.pagination.offset` (string): The offset for pagination (required)
- `params.pagination.limit` (string): The limit for pagination (required)
- `params.queryOptions` (optional): React Query options to customize behavior

#### `useBackendMoneyMarketAssetSuppliers(params)`

Fetches suppliers for a specific money market asset with pagination. The query is disabled if `reserveAddress`, `offset`, or `limit` are missing.

```typescript
import { useBackendMoneyMarketAssetSuppliers } from '@sodax/dapp-kit';

const { data: suppliers, isLoading, error } = useBackendMoneyMarketAssetSuppliers({
  params: { reserveAddress: '0xabc...' },
  pagination: { offset: '0', limit: '20' },
});
```

**Parameters:**

- `params.params.reserveAddress` (string | undefined): The reserve contract address to query
- `params.pagination.offset` (string): The offset for pagination (required)
- `params.pagination.limit` (string): The limit for pagination (required)
- `params.queryOptions` (optional): React Query options to customize behavior

#### `useBackendAllMoneyMarketBorrowers(params)`

Fetches all money market borrowers across all assets with pagination. The query is disabled if pagination parameters are missing.

```typescript
import { useBackendAllMoneyMarketBorrowers } from '@sodax/dapp-kit';

const { data: borrowers, isLoading, error } = useBackendAllMoneyMarketBorrowers({
  pagination: { offset: '0', limit: '50' },
});
```

**Parameters:**

- `params.pagination.offset` (string): The offset for pagination (required)
- `params.pagination.limit` (string): The limit for pagination (required)
- `params.queryOptions` (optional): React Query options to customize behavior

## Features

- **Automatic Caching**: All hooks use React Query for efficient data caching
- **Error Handling**: Built-in error states and retry logic (default: 3 retries)
- **Loading States**: Automatic loading indicators
- **TypeScript Support**: Full type safety with proper TypeScript definitions
- **Pagination Support**: Built-in pagination for list endpoints (offset/limit as strings)
- **Conditional Queries**: Queries are automatically disabled when required parameters are missing or empty
- **Context Integration**: Uses `useSodaxContext` for consistent SDK access across the application
- **Auto-refetch**: `useBackendIntentByTxHash` has a default refetch interval of 1 second for real-time updates

## Stale Times

Different hooks have different stale times optimized for their data types:

- **`useBackendOrderbook`**: 30 seconds (default) - for near-real-time solver orderbook updates
- **Other hooks**: No default stale time set - uses React Query defaults. You can customize via `queryOptions.staleTime`

## Error Handling

All hooks return standard React Query result objects with:

- `data`: The fetched data (undefined when loading or on error)
- `isLoading`: Boolean indicating if the request is in progress
- `error`: Error object if the request failed
- `refetch`: Function to manually trigger a data refresh

## Requirements

- **SodaxProvider**: All backend hooks require the app to be wrapped with `SodaxProvider` from `@sodax/dapp-kit`
- **React Query**: The hooks use React Query for state management and caching

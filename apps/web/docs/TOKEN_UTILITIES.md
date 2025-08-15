# Token Utilities Documentation

This document explains how to use the token utilities for reading all supported solver tokens from all chains in the Sodax application.

## Overview

The token utilities provide a comprehensive way to access and filter supported solver tokens across all chains. This functionality is useful for:

- Token selection dialogs
- Cross-chain token exploration
- Token filtering and search
- Chain-specific token analysis

## Core Functions

### `getAllSupportedSolverTokens()`

Returns all supported solver tokens from all chains as `XToken[]` objects.

```typescript
import { getAllSupportedSolverTokens } from '@/lib/utils';

const allTokens = getAllSupportedSolverTokens();
console.log(`Total tokens: ${allTokens.length}`);
```

### `getSupportedSolverTokensForChain(chainId)`

Returns supported solver tokens for a specific chain.

```typescript
import { getSupportedSolverTokensForChain } from '@/lib/utils';
import type { SpokeChainId } from '@sodax/types';

const baseTokens = getSupportedSolverTokensForChain('0x2105' as SpokeChainId);
console.log(`Base chain tokens: ${baseTokens.length}`);
```

## React Hooks

### `useSupportedTokens()`

A React hook that provides comprehensive token management with filtering capabilities.

```typescript
import { useSupportedTokens } from '@/hooks/useSupportedTokens';

const MyComponent = () => {
  const {
    tokens,           // Filtered tokens
    allTokens,        // All tokens from all chains
    tokensByChain,    // Tokens grouped by chain
    tokenSummary,     // Token count by chain
    isLoading,        // Loading state
    error,           // Error state
    filterByChain,   // Filter by chain function
    filterBySearch,  // Filter by search function
    filterBySymbol,  // Filter by symbol function
    clearFilters,    // Clear all filters function
  } = useSupportedTokens();

  return (
    <div>
      <p>Total tokens: {allTokens.length}</p>
      <p>Filtered tokens: {tokens.length}</p>
    </div>
  );
};
```

### `useChainTokens(chainId)`

A React hook for getting tokens for a specific chain.

```typescript
import { useChainTokens } from '@/hooks/useSupportedTokens';

const MyComponent = () => {
  const { tokens, isLoading, error } = useChainTokens('0x2105' as SpokeChainId);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {tokens.map(token => (
        <div key={token.address}>
          {token.symbol} - {token.name}
        </div>
      ))}
    </div>
  );
};
```

## Usage Examples

### Basic Token Exploration

```typescript
import { getAllSupportedSolverTokens } from '@/lib/utils';

// Get all tokens
const allTokens = getAllSupportedSolverTokens();

// Find all USDC tokens across chains
const usdcTokens = allTokens.filter(token => 
  token.symbol.toLowerCase() === 'usdc'
);

// Group tokens by chain
const tokensByChain = allTokens.reduce((acc, token) => {
  const chainId = token.xChainId;
  if (!acc[chainId]) acc[chainId] = [];
  acc[chainId].push(token);
  return acc;
}, {} as Record<string, typeof allTokens>);
```

### Token Selection Dialog

The `TokenSelectorDialog` component has been updated to show tokens from all chains:

```typescript
import TokenSelectorDialog from '@/components/swap/token-selector-dialog';

// The dialog now shows tokens from all chains with filtering options
<TokenSelectorDialog
  isOpen={isOpen}
  onClose={onClose}
  onTokenSelect={handleTokenSelect}
  chainId={currentChainId}
  selectedToken={selectedToken}
/>
```

### Advanced Filtering

```typescript
import { useSupportedTokens } from '@/hooks/useSupportedTokens';

const TokenExplorer = () => {
  const {
    tokens,
    filterByChain,
    filterBySearch,
    clearFilters,
  } = useSupportedTokens();

  // Filter by chain
  const handleChainSelect = (chainId: string) => {
    filterByChain(chainId as SpokeChainId);
  };

  // Filter by search
  const handleSearch = (query: string) => {
    filterBySearch(query);
  };

  return (
    <div>
      <input 
        placeholder="Search tokens..." 
        onChange={(e) => handleSearch(e.target.value)} 
      />
      <button onClick={() => filterByChain('0x2105' as SpokeChainId)}>
        Show Base tokens
      </button>
      <button onClick={clearFilters}>
        Clear filters
      </button>
      
      {tokens.map(token => (
        <div key={`${token.xChainId}-${token.address}`}>
          {token.symbol} on {token.xChainId}
        </div>
      ))}
    </div>
  );
};
```

## Token Data Structure

Each token object (`XToken`) contains:

```typescript
interface XToken {
  address: string;        // Token contract address
  symbol: string;         // Token symbol (e.g., "USDC")
  name: string;          // Token name (e.g., "USD Coin")
  decimals: number;      // Token decimals
  xChainId: SpokeChainId; // Chain ID where this token exists
}
```

## Error Handling

The utilities include error handling for cases where:

- A chain is not supported
- Token data is unavailable
- Network errors occur

```typescript
try {
  const tokens = getAllSupportedSolverTokens();
  // Use tokens
} catch (error) {
  console.error('Failed to load tokens:', error);
  // Handle error appropriately
}
```

## Performance Considerations

- Token data is loaded synchronously from the SDK constants
- For large token lists, consider implementing pagination or virtualization
- The `useSupportedTokens` hook uses `useMemo` for efficient filtering
- Token filtering is done client-side for better performance

## Testing

Use the test utilities to verify functionality:

```typescript
import { testGetAllSupportedSolverTokens } from '@/lib/token-utils.test';

// Run in browser console or test environment
testGetAllSupportedSolverTokens();
```

## Example Component

See `TokenExplorer` component in `apps/web/components/examples/TokenExplorer.tsx` for a complete implementation example.

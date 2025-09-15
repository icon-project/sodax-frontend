# Token Grouping Feature

This document describes the token grouping feature that allows displaying multiple tokens with the same symbol (like USDT across different chains) with a count badge.

## Components

### TokenGroupLogo

A component that displays a group of tokens with the same symbol, showing a count badge when there are multiple tokens.

```tsx
import TokenGroupLogo from '@/components/shared/token-group-logo';

// Example usage
<TokenGroupLogo 
  tokens={usdtTokens} 
  symbol="USDT" 
  className="w-12 h-10" 
  showCount={true}
/>
```

**Props:**
- `tokens`: Array of XToken objects with the same symbol
- `symbol`: The token symbol (e.g., "USDT")
- `className`: Optional CSS classes
- `showCount`: Whether to show the count badge (default: true)

### TokenChainSelector

A dialog component that appears when a user clicks on a token with multiple chains, allowing them to select the specific chain version.

```tsx
import TokenChainSelector from '@/components/shared/token-chain-selector';

<TokenChainSelector
  isOpen={isOpen}
  onClose={onClose}
  onTokenSelect={handleTokenSelect}
  tokens={usdtTokens}
  symbol="USDT"
/>
```

## Utility Functions

### groupTokensBySymbol

Groups an array of tokens by their symbol.

```tsx
import { groupTokensBySymbol } from '@/lib/token-utils';

const groupedTokens = groupTokensBySymbol(allTokens);
// Returns: { "usdt": [token1, token2, ...], "btc": [token3, ...] }
```

### getUniqueTokenSymbols

Returns an array of unique token symbols with their associated tokens.

```tsx
import { getUniqueTokenSymbols } from '@/lib/token-utils';

const uniqueSymbols = getUniqueTokenSymbols(allTokens);
// Returns: [{ symbol: "USDT", tokens: [token1, token2, ...] }, ...]
```

## Usage Example

```tsx
import { getAllSupportedSolverTokens } from '@/lib/utils';
import { getUniqueTokenSymbols } from '@/lib/token-utils';
import TokenGroupLogo from '@/components/shared/token-group-logo';

const TokenSelector = () => {
  const allTokens = getAllSupportedSolverTokens();
  const uniqueTokenSymbols = getUniqueTokenSymbols(allTokens);

  return (
    <div className="grid grid-cols-3 gap-4">
      {uniqueTokenSymbols.map(({ symbol, tokens }) => (
        <div key={symbol} className="flex flex-col items-center">
          <TokenGroupLogo 
            tokens={tokens} 
            symbol={symbol} 
            className="w-12 h-10" 
          />
          <span className="text-sm font-medium">{symbol}</span>
        </div>
      ))}
    </div>
  );
};
```

## Features

1. **Count Badge**: Shows the number of chains where the token is available
2. **Primary Token Display**: Uses the first token in the array for the main logo
3. **Chain Selection**: When clicked, shows a dialog to select the specific chain
4. **Responsive Design**: Works well on different screen sizes
5. **Type Safety**: Fully typed with TypeScript

## Styling

The count badge uses the following Tailwind classes:
- Background: `bg-espresso` (dark brown)
- Text: `text-white`
- Shape: `rounded-full`
- Size: `min-w-[20px] h-5`
- Position: `absolute -top-1 -right-1`

## Future Enhancements

1. **Preferred Chain**: Allow users to set a preferred chain for each token
2. **Chain Icons**: Show small chain icons in the count badge
3. **Token Metadata**: Display additional token information in the chain selector
4. **Search by Chain**: Add search functionality in the chain selector
5. **Recent Selection**: Remember the last selected chain for each token

// apps/web/lib/token-utils.ts
import type { XToken } from '@sodax/types';

/**
 * Group tokens by their symbol
 * @param tokens Array of XToken objects
 * @returns Object with symbol as key and array of tokens as value
 */
export const groupTokensBySymbol = (tokens: XToken[]): Record<string, XToken[]> => {
  return tokens.reduce(
    (groups, token) => {
      const symbol = token.symbol.toLowerCase();
      if (!groups[symbol]) {
        groups[symbol] = [];
      }
      groups[symbol].push(token);
      return groups;
    },
    {} as Record<string, XToken[]>,
  );
};

/**
 * Get unique token symbols with their associated tokens
 * @param tokens Array of XToken objects
 * @returns Array of objects with symbol and tokens array
 */
export const getUniqueTokenSymbols = (tokens: XToken[]): Array<{ symbol: string; tokens: XToken[] }> => {
  const grouped = groupTokensBySymbol(tokens);

  return Object.entries(grouped).map(([symbol, tokenArray]) => ({
    symbol: tokenArray[0]?.symbol || '', // Use the original case from the first token
    tokens: tokenArray,
  }));
};

/**
 * Filter tokens by symbol and chain
 * @param tokens Array of XToken objects
 * @param symbol Token symbol to filter by
 * @param chainId Optional chain ID to filter by
 * @returns Array of filtered tokens
 */
export const filterTokensBySymbolAndChain = (tokens: XToken[], symbol: string, chainId?: string): XToken[] => {
  return tokens.filter(token => {
    const symbolMatch = token.symbol.toLowerCase() === symbol.toLowerCase();
    const chainMatch = !chainId || token.xChainId === chainId;
    return symbolMatch && chainMatch;
  });
};

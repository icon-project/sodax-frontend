import type { XToken } from '@sodax/types';
import type { ChainBalanceEntry } from '@/hooks/useAllChainBalances';

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

/**
 * Helper function to get balance for a specific token on a specific chain
 * @param balances Balance map from useAllChainBalances
 * @param tokenAddress Token address to get balance for
 * @param chainId Chain ID to get balance for
 * @returns Balance for the token on the specified chain, or 0n if not found
 */
export function getChainBalance(balances: Record<string, ChainBalanceEntry[]>, token: XToken): bigint {
  const entries = balances[token.address] || [];
  const entry = entries.find(e => e.chainId === token.xChainId);
  return entry?.balance || 0n;
}

/**
 * Helper function to check if a token address exists in balances
 * @param balances Balance map from useAllChainBalances
 * @param tokenAddress Token address to check
 * @returns true if the token address exists in balances, false otherwise
 */
export function hasTokenBalance(balances: Record<string, ChainBalanceEntry[]>, token: XToken): boolean {
  const entries = balances[token.address] || [];
  const entry = entries.find(e => e.chainId === token.xChainId);
  return entry !== undefined;
}

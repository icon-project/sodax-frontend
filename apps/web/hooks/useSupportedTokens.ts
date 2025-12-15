// apps/web/hooks/useSupportedTokens.ts
import { useMemo, useState } from 'react';
import { getAllSupportedSolverTokens, getSupportedSolverTokensForChain } from '@/lib/utils';
import type { XToken, SpokeChainId } from '@sodax/types';

interface UseSupportedTokensOptions {
  chainId?: SpokeChainId;
  searchQuery?: string;
  symbolFilter?: string;
}

interface UseSupportedTokensReturn {
  tokens: XToken[];
  allTokens: XToken[];
  tokensByChain: Record<SpokeChainId, XToken[]>;
  tokenSummary: Record<string, number>;
  isLoading: boolean;
  error: Error | null;
  filterByChain: (chainId: SpokeChainId | 'all') => void;
  filterBySearch: (query: string) => void;
  filterBySymbol: (symbol: string) => void;
  clearFilters: () => void;
}

/**
 * React hook for accessing and filtering supported solver tokens
 */
export const useSupportedTokens = (options: UseSupportedTokensOptions = {}): UseSupportedTokensReturn => {
  const [chainFilter, setChainFilter] = useState<SpokeChainId | 'all'>(options.chainId || 'all');
  const [searchFilter, setSearchFilter] = useState<string>(options.searchQuery || '');
  const [symbolFilter, setSymbolFilter] = useState<string>(options.symbolFilter || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Get all tokens with error handling
  const allTokens = useMemo(() => {
    try {
      setIsLoading(true);
      setError(null);
      const tokens = getAllSupportedSolverTokens();
      setIsLoading(false);
      return tokens;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load tokens');
      setError(error);
      setIsLoading(false);
      return [];
    }
  }, []);

  // Group tokens by chain
  const tokensByChain = useMemo(() => {
    return allTokens.reduce(
      (acc, token) => {
        const chainId = token.xChainId;
        if (!acc[chainId]) {
          acc[chainId] = [];
        }
        acc[chainId].push(token);
        return acc;
      },
      {} as Record<SpokeChainId, XToken[]>,
    );
  }, [allTokens]);

  // Get token summary
  const tokenSummary = useMemo(() => {
    return allTokens.reduce(
      (acc, token) => {
        const chainId = token.xChainId;
        acc[chainId] = (acc[chainId] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }, [allTokens]);

  // Filter tokens based on current filters
  const tokens = useMemo(() => {
    return allTokens.filter(token => {
      // Chain filter
      const matchesChain = chainFilter === 'all' || token.xChainId === chainFilter;

      // Search filter
      const matchesSearch =
        !searchFilter ||
        token.symbol.toLowerCase().includes(searchFilter.toLowerCase()) ||
        token.name.toLowerCase().includes(searchFilter.toLowerCase());

      // Symbol filter
      const matchesSymbol = !symbolFilter || token.symbol.toLowerCase() === symbolFilter.toLowerCase();

      return matchesChain && matchesSearch && matchesSymbol;
    });
  }, [allTokens, chainFilter, searchFilter, symbolFilter]);

  // Filter functions
  const filterByChain = (chainId: SpokeChainId | 'all'): void => {
    setChainFilter(chainId);
  };

  const filterBySearch = (query: string): void => {
    setSearchFilter(query);
  };

  const filterBySymbol = (symbol: string): void => {
    setSymbolFilter(symbol);
  };

  const clearFilters = (): void => {
    setChainFilter('all');
    setSearchFilter('');
    setSymbolFilter('');
  };

  return {
    tokens,
    allTokens,
    tokensByChain,
    tokenSummary,
    isLoading,
    error,
    filterByChain,
    filterBySearch,
    filterBySymbol,
    clearFilters,
  };
};

/**
 * Hook for getting tokens for a specific chain
 */
export const useChainTokens = (chainId: SpokeChainId) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [tokens, setTokens] = useState<XToken[]>([]);

  useMemo(() => {
    try {
      setIsLoading(true);
      setError(null);
      const chainTokens = getSupportedSolverTokensForChain(chainId);
      setTokens(chainTokens);
      setIsLoading(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Failed to load tokens for chain ${chainId}`);
      setError(error);
      setIsLoading(false);
      setTokens([]);
    }
  }, [chainId]);

  return { tokens, isLoading, error };
};

import type { ChainId, XToken } from '@sodax/types';
import { useSodaxContext } from '@sodax/dapp-kit';

/**
 * Resolve a token *by symbol* on the selected chain, using Sodax SDK config.
 */
export function useTokenOnChain(symbol: string, chainId: ChainId): XToken | undefined {
  const { sodax } = useSodaxContext();

  const token = sodax.config.findSupportedTokenBySymbol(chainId, symbol);
  if (!token) return undefined;

  return {
    address: token.address,
    decimals: token.decimals,
    symbol: token.symbol,
    name: token.name ?? token.symbol,
    xChainId: chainId,
  };
}

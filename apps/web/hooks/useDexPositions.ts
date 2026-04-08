// apps/web/hooks/useDexPositions.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { SpokeChainId } from '@sodax/types';
import { createDexTokenIdsStorageKey } from '@/lib/utils';

export type SavedDexPosition = {
  tokenId: string;
  chainId: string;
};

type PositionsApiItem = {
  token_id: string;
  pool_id: string;
  is_burned: boolean;
};

type UseDexPositionsParams = {
  hubWalletAddress: string | undefined;
  poolId: string | null;
  selectedNetworkChainId: SpokeChainId | null;
};

type UseDexPositionsReturn = UseQueryResult<SavedDexPosition[], Error> & {
  savedPositions: SavedDexPosition[];
};

export function useDexPositions({
  hubWalletAddress,
  poolId,
  selectedNetworkChainId,
}: UseDexPositionsParams): UseDexPositionsReturn {
  const queryResult = useQuery<SavedDexPosition[], Error>({
    queryKey: ['poolSavedPositions', hubWalletAddress, poolId, selectedNetworkChainId],
    enabled: Boolean(hubWalletAddress),
    gcTime: 0,
    queryFn: async (): Promise<SavedDexPosition[]> => {
      if (!hubWalletAddress) {
        return [];
      }

      const endpoint = `/api/pool/positions?address=${encodeURIComponent(hubWalletAddress)}&include_burned=false&limit=100&offset=0`;
      const response = await fetch(endpoint, { method: 'GET', cache: 'no-store' });
      if (!response.ok) {
        return [];
      }

      const responsePayload = (await response.json()) as unknown;
      if (!Array.isArray(responsePayload)) {
        return [];
      }

      const positions = responsePayload as PositionsApiItem[];
      const normalizedPoolId = poolId?.toLowerCase() ?? '';
      const apiPositions = positions
        .filter(position => !position.is_burned && position.pool_id.toLowerCase() === normalizedPoolId)
        .map(
          (position): SavedDexPosition => ({
            tokenId: position.token_id,
            chainId: selectedNetworkChainId ? String(selectedNetworkChainId) : 'sonic',
          }),
        );

      if (typeof globalThis.localStorage === 'undefined') {
        return apiPositions;
      }

      const chainId = selectedNetworkChainId ? String(selectedNetworkChainId) : 'sonic';
      const storageKey = createDexTokenIdsStorageKey(chainId, hubWalletAddress);
      const localTokenIdsRaw = globalThis.localStorage.getItem(storageKey);
      if (!localTokenIdsRaw) {
        return apiPositions;
      }

      const localTokenIds = localTokenIdsRaw
        .split(',')
        .map(tokenId => tokenId.trim())
        .filter(tokenId => tokenId.length > 0);
      if (localTokenIds.length === 0) {
        return apiPositions;
      }

      const existingTokenIds = new Set(apiPositions.map(position => position.tokenId.toLowerCase()));
      const localPositions: SavedDexPosition[] = localTokenIds
        .filter(tokenId => !existingTokenIds.has(tokenId.toLowerCase()))
        .map(
          (tokenId): SavedDexPosition => ({
            tokenId,
            chainId,
          }),
        );

      return [...apiPositions, ...localPositions];
    },
  });

  return {
    ...queryResult,
    savedPositions: queryResult.data ?? [],
  };
}

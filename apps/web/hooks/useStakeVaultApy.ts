// apps/web/hooks/useStakeVaultApy.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

const STAKE_APY_ENDPOINT = '/api/stake/vault-apy?days=7';

interface StakeVaultApyResponse {
  apyPercent: number;
}

async function fetchStakeVaultApy(): Promise<number> {
  const response = await fetch(STAKE_APY_ENDPOINT, { method: 'GET' });

  if (!response.ok) {
    throw new Error(`Failed to fetch APY: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('apyPercent' in data)) {
    throw new Error('Invalid APY response');
  }

  const apyPercent = (data as StakeVaultApyResponse).apyPercent;
  if (Number.isNaN(apyPercent) || typeof apyPercent !== 'number') {
    throw new Error('Invalid APY value');
  }

  return apyPercent;
}

export function useStakeVaultApy(): UseQueryResult<number, Error> {
  return useQuery({
    queryKey: ['stake', 'vaultApy'],
    queryFn: fetchStakeVaultApy,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    retry: 2,
  });
}

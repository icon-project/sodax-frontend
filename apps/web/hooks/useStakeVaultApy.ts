// apps/web/hooks/useStakeVaultApy.ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

const STAKE_APY_ENDPOINT =
  'https://api.sodax.com/v1/a/v1/vault-rates/0xADC6561Cc8FC31767B4917CCc97F510D411378d9/apy?days=7';

interface StakeVaultApyResponse {
  apy_percent: string;
}

async function fetchStakeVaultApy(): Promise<number> {
  const response = await fetch(STAKE_APY_ENDPOINT, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch APY: ${response.status}`);
  }

  const data: unknown = await response.json();
  if (!data || typeof data !== 'object' || !('apy_percent' in data)) {
    throw new Error('Invalid APY response');
  }

  const apyPercentRaw = (data as StakeVaultApyResponse).apy_percent;
  const apyPercent = Number.parseFloat(apyPercentRaw);
  if (Number.isNaN(apyPercent)) {
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

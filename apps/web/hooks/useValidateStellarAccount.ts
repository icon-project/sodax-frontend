import { type StellarXService, useXService } from '@sodax/wallet-sdk-react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';

export type StellarAccountValidation = { ok: true } | { ok: false; error: string };

export function useValidateStellarAccount(address?: string | null): UseQueryResult<StellarAccountValidation> {
  const stellarService = useXService('STELLAR') as StellarXService;
  const [verifiedAddresses, setVerifiedAddresses] = useState<{ [key: string]: boolean }>({});

  return useQuery<StellarAccountValidation>({
    queryKey: ['stellarAccountValidation', stellarService, address],
    queryFn: async () => {
      if (typeof address !== 'string') {
        return { ok: true };
      }

      try {
        await stellarService.server.loadAccount(address);
        setVerifiedAddresses(prev => ({ ...prev, [address]: true }));
        return { ok: true };
      } catch (e) {
        return { ok: false, error: 'Stellar wallet inactive. Add at least 1 XLM from an external source' };
      }
    },
    enabled: typeof address === 'string' && !verifiedAddresses[address],
    refetchInterval: 5000,
  });
}

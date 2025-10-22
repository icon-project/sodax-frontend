import type { XToken } from '@sodax/types';
import { type StellarXService, useXService } from '@sodax/wallet-sdk-react';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { Horizon } from '@stellar/stellar-sdk';

export const STELLAR_TRUSTLINE_TOKEN_INFO = [
  {
    asset_code: 'USDC',
    contract_id: 'CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZLEO7SJMI75',
    asset_issuer: 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN',
  },
  {
    asset_code: 'bnUSD',
    contract_id: 'CD6YBFFWMU2UJHX2NGRJ7RN76IJVTCC7MRA46DUBXNB7E6W7H7JRJ2CX',
    asset_issuer: 'GDYUTHY75A7WUZJQDPOP66FB32BOYGZRXHWTWO4Q6LQTANT5X3V5HNFA',
  },
];

export type StellarTrustlineValidation = { ok: true } | { ok: false; error: string };

export function useValidateStellarTrustline(
  address?: string | null,
  token?: XToken,
): UseQueryResult<StellarTrustlineValidation> {
  const stellarService = useXService('STELLAR') as StellarXService;

  const checkIfTrustlineExists = (
    balances: Horizon.HorizonApi.BalanceLineAsset<'credit_alphanum4' | 'credit_alphanum12'>[],
    asset_code: string,
    asset_issuer: string,
  ): boolean => {
    return balances.some(
      ({ asset_code: code, asset_issuer: issuer }) => code === asset_code && issuer === asset_issuer,
    );
  };

  return useQuery<StellarTrustlineValidation>({
    queryKey: ['stellar-trustline-check', address, token],
    queryFn: async () => {
      if (!address || !token) {
        return { ok: true };
      }

      const trustlineInfo = STELLAR_TRUSTLINE_TOKEN_INFO.find(info => info.contract_id === token.address);

      if (!trustlineInfo) {
        return { ok: true };
      }

      const { balances } = await stellarService.server.accounts().accountId(address).call();

      if (
        trustlineInfo &&
        checkIfTrustlineExists(
          balances as Horizon.HorizonApi.BalanceLineAsset<'credit_alphanum4' | 'credit_alphanum12'>[],
          trustlineInfo.asset_code,
          trustlineInfo.asset_issuer,
        )
      ) {
        return { ok: true };
      }

      return { ok: false, error: `Trustline does not exist for ${token.symbol}` };
    },
    refetchInterval: 2000,
  });
}

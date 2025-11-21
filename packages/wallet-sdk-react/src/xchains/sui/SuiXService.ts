import { XService } from '@/core/XService';
import type { XToken } from '@sodax/types';
import { isNativeToken } from '@/utils';

export class SuiXService extends XService {
  private static instance: SuiXService;

  public suiClient: any; // TODO: define suiClient type
  public suiWallet: any; // TODO: define suiWallet type
  public suiAccount: any; // TODO: define suiAccount type

  private constructor() {
    super('SUI');
  }

  public static getInstance(): SuiXService {
    if (!SuiXService.instance) {
      SuiXService.instance = new SuiXService();
    }
    return SuiXService.instance;
  }

  // getBalance is not used because getBalances uses getAllBalances which returns all balances

  async getBalances(address: string | undefined, xTokens: readonly XToken[]): Promise<Record<string, bigint>> {
    if (!address) return {};
    try {
      const balancePromises = xTokens.map(async xToken => {
        let coinType = isNativeToken(xToken) ? '0x2::sui::SUI' : xToken.address;

        //  TODO: hard coded for getting legacy bnUSD balance
        if (
          coinType ===
          '0x03917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR'
        ) {
          coinType =
            '0x3917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR';
        }

        const balance = await this.suiClient.getBalance({
          owner: address,
          coinType: coinType,
        });

        return {
          address: xToken.address,
          balance: balance ? BigInt(balance.totalBalance) : undefined,
        };
      });

      const results = await Promise.all(balancePromises);

      const tokenMap: Record<string, bigint> = {};
      results.forEach(result => {
        if (result.balance !== undefined) {
          tokenMap[result.address] = result.balance;
        }
      });

      return tokenMap;
    } catch (e) {
      console.log('error', e);
      return {};
    }
  }
}

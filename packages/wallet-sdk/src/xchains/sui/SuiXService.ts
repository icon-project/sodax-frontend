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

  async getBalances(address: string | undefined, xTokens: XToken[]) {
    if (!address) return {};

    try {
      const allBalances = await this.suiClient.getAllBalances({
        owner: address,
      });
      const tokenMap = xTokens.reduce((map, xToken) => {
        const coinType = isNativeToken(xToken) ? '0x2::sui::SUI' : xToken.address;
        const balance = allBalances.find(b => b.coinType === coinType);

        if (balance) map[xToken.address] = balance.totalBalance;
        return map;
      }, {});

      return tokenMap;
    } catch (e) {
      console.log('error', e);
      return {};
    }
  }
}

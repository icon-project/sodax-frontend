import { XService } from '@/core/XService';
import type { IconService } from 'icon-sdk-js';
import * as IconSdkRaw from 'icon-sdk-js';
import type { XToken } from '@sodax/types';
import { isNativeToken } from '@/utils';

const IconSdk = ('default' in IconSdkRaw.default ? IconSdkRaw.default : IconSdkRaw) as typeof IconSdkRaw;
const { IconService: IconServiceConstructor, Builder: IconBuilder, Converter: IconConverter } = IconSdk;
export interface CallData {
  target: string;
  method: string;
  params: string[];
}

export enum SupportedChainId {
  MAINNET = 1,
}

interface ChainInfo {
  readonly name: string;
  readonly node: string;
  readonly APIEndpoint: string;
  readonly debugAPIEndpoint: string;
  readonly chainId: number;
  readonly tracker: string;
}

export const CHAIN_INFO: { readonly [chainId: number]: ChainInfo } = {
  [SupportedChainId.MAINNET]: {
    name: 'ICON Mainnet',
    node: 'https://ctz.solidwallet.io',
    APIEndpoint: 'https://ctz.solidwallet.io/api/v3',
    debugAPIEndpoint: 'https://api.icon.community/api/v3d',
    chainId: 1,
    tracker: 'https://tracker.icon.community',
  },
};

export class IconXService extends XService {
  private static instance: IconXService;

  public iconService: IconService;

  private constructor() {
    super('ICON');
    this.iconService = new IconServiceConstructor(
      new IconServiceConstructor.HttpProvider(CHAIN_INFO[SupportedChainId.MAINNET].APIEndpoint),
    );
  }

  public static getInstance(): IconXService {
    if (!IconXService.instance) {
      IconXService.instance = new IconXService();
    }
    return IconXService.instance;
  }

  private async getAggregateData(requireSuccess: boolean, calls: CallData[]) {
    const rawTx = new IconBuilder.CallBuilder()
      // muticall address on mainnet
      .to('cxa4aa9185e23558cff990f494c1fd2845f6cbf741')
      .method('tryAggregate')
      .params({ requireSuccess: IconConverter.toHex(requireSuccess ? 1 : 0), calls })
      .build();

    try {
      const result = await this.iconService.call(rawTx).execute();
      const aggs = result['returnData'];

      const data = aggs.map(agg => {
        if (agg['success'] === '0x0') {
          return null;
        }
        return agg['returnData'];
      });

      return data;
    } catch (err) {
      console.error(err);
      return Array(calls.length).fill(null);
    }
  }

  async getBalances(address: string | undefined, xTokens: XToken[]) {
    if (!address) return {};

    const balances = {};

    const nativeXToken = xTokens.find(xToken => isNativeToken(xToken));
    const nonNativeXTokens = xTokens.filter(xToken => !isNativeToken(xToken));

    if (nativeXToken) {
      const balance = await this.iconService.getBalance(address).execute();
      balances[nativeXToken.address] = BigInt(balance.toFixed());
    }

    const cds: CallData[] = nonNativeXTokens.map(token => {
      return {
        target: token.address,
        method: 'balanceOf',
        params: [address],
      };
    });

    const data: string[] = await this.getAggregateData(
      false,
      cds.filter(cd => cd.target.startsWith('cx')),
    );

    return nonNativeXTokens.reduce((agg, token, idx) => {
      const balance = data[idx];
      balances[token.address] = BigInt(balance);

      return agg;
    }, balances);
  }
}

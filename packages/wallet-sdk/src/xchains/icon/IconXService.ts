import { XService } from '@/core/XService';
import IconService from 'icon-sdk-js';
import type { ChainId, XToken } from '@sodax/types';
import { isNativeToken } from '@/utils';
  // import type { CallData } from '@balancednetwork/balanced-js';
  // import { BalancedJs } from '@balancednetwork/balanced-js';

enum SupportedChainId {
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

const CHAIN_INFO: { readonly [chainId: number]: ChainInfo } = {
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
    this.iconService = new IconService(new IconService.HttpProvider(CHAIN_INFO[SupportedChainId.MAINNET].APIEndpoint));
    // this.bnJs = new BalancedJs({ networkId: 1 });
  }

  public static getInstance(): IconXService {
    if (!IconXService.instance) {
      IconXService.instance = new IconXService();
    }
    return IconXService.instance;
  }

  // async getBalance(address: string | undefined, xToken: XToken, xChainId: ChainId): Promise<bigint> {
  //   // not used
  //   return Promise.resolve(undefined);
  // }

  // async getBalances(address: string | undefined, xTokens: XToken[], xChainId: ChainId) {
  //   if (!address) return {};

  //   const balances = {};

  //   const nativeXToken = xTokens.find(xToken => isNativeToken(xToken));
  //   const nonNativeXTokens = xTokens.filter(xToken => !isNativeToken(xToken));

  //   if (nativeXToken) {
  //     const balance = await bnJs.ICX.balanceOf(address).then(res => res.toFixed());
  //     balances[nativeXToken.address] = BigInt(balance);
  //   }

  //   const cds: CallData[] = nonNativeXTokens.map(token => {
  //     return {
  //       target: token.address,
  //       method: 'balanceOf',
  //       params: [address],
  //     };
  //   });

  //   const data: string[] = await bnJs.Multicall.getAggregateData(cds.filter(cd => cd.target.startsWith('cx')));

  //   return nonNativeXTokens.reduce((agg, token, idx) => {
  //     const balance = data[idx];
  //     balances[token.address] = BigInt(balance);

  //     return agg;
  //   }, balances);
  // }
}

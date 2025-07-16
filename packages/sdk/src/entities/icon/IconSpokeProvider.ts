import type { IconSpokeChainConfig } from '../../types.js';
import * as IconSdkRaw from 'icon-sdk-js';
const IconSdk = (IconSdkRaw.default?.default ? IconSdkRaw.default : IconSdkRaw) as typeof IconSdkRaw;
import type { IIconWalletProvider } from '@sodax/types';



export class IconSpokeProvider {
  public readonly walletProvider: IIconWalletProvider;
  public readonly chainConfig: IconSpokeChainConfig;
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  public readonly iconService: any;

  constructor(
    walletProvider: IIconWalletProvider,
    chainConfig: IconSpokeChainConfig,
    rpcUrl: `http${string}` = 'https://ctz.solidwallet.io/api/v3', // default to mainnet
  ) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
    this.iconService = new IconSdk.IconService(new IconSdk.IconService.HttpProvider(rpcUrl));
  }
}

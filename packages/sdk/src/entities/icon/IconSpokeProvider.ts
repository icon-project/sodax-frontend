import type { IconSpokeChainConfig } from '../../types.js';
import type { IIconWalletProvider } from '@sodax/types';
import pkg from 'icon-sdk-js';
const { IconService } = pkg;

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
    this.iconService = new IconService(new IconService.HttpProvider(rpcUrl));
  }
}

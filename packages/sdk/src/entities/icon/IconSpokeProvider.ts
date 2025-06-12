import type { IconSpokeChainConfig } from '../../types.js';
import type { IIconWalletProvider } from '../../interfaces.js';
import IconService from 'icon-sdk-js';

export class IconSpokeProvider {
  public readonly walletProvider: IIconWalletProvider;
  public readonly chainConfig: IconSpokeChainConfig;
  public readonly iconService: IconService.IconService;

  constructor(
    walletProvider: IIconWalletProvider,
    chainConfig: IconSpokeChainConfig,
    rpcUrl: `http${string}` = 'https://ctz.solidwallet.io/api/v3', // default to mainnet
  ) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
    this.iconService = new IconService.IconService(new IconService.HttpProvider(rpcUrl));
  }
}

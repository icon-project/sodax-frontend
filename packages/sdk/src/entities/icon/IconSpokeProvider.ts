import type { HttpUrl, IconSpokeChainConfig } from '../../types.js';
import { IconService as IconServiceConstructor } from 'icon-sdk-js';
import type { IconService } from 'icon-sdk-js';
import type { IIconWalletProvider } from '@sodax/types';

export class IconSpokeProvider {
  public readonly walletProvider: IIconWalletProvider;
  public readonly chainConfig: IconSpokeChainConfig;
  public readonly iconService: IconService;
  public readonly debugRpcUrl: HttpUrl;

  constructor(
    walletProvider: IIconWalletProvider,
    chainConfig: IconSpokeChainConfig,
    rpcUrl: HttpUrl = 'https://ctz.solidwallet.io/api/v3', // default to mainnet
    debugRpcUrl: HttpUrl = 'https://ctz.solidwallet.io/api/v3d', // default to mainnet
  ) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
    this.iconService = new IconServiceConstructor(new IconServiceConstructor.HttpProvider(rpcUrl));
    this.debugRpcUrl = debugRpcUrl;
  }
}

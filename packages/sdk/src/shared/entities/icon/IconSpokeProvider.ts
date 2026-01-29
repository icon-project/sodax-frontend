import type { HttpUrl, IconSpokeChainConfig, WalletAddressProvider } from '@sodax/types';
import * as IconSdkRaw from 'icon-sdk-js';
const IconSdk = ('default' in IconSdkRaw.default ? IconSdkRaw.default : IconSdkRaw) as typeof IconSdkRaw;
import type { IconService } from 'icon-sdk-js';
import type { IIconWalletProvider } from '@sodax/types';
import type { IRawSpokeProvider, ISpokeProvider } from '../index.js';

export class IconBaseSpokeProvider {
  public readonly chainConfig: IconSpokeChainConfig;
  public readonly iconService: IconService;
  public readonly debugRpcUrl: HttpUrl;

  constructor(
    chainConfig: IconSpokeChainConfig,
    rpcUrl: HttpUrl = 'https://ctz.solidwallet.io/api/v3', // default to mainnet
    debugRpcUrl: HttpUrl = 'https://ctz.solidwallet.io/api/v3d', // default to mainnet
  ) {
    this.chainConfig = chainConfig;
    this.iconService = new IconSdk.IconService(new IconSdk.IconService.HttpProvider(rpcUrl));
    this.debugRpcUrl = debugRpcUrl;
  }
}

export class IconSpokeProvider extends IconBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: IIconWalletProvider;

  constructor(
    walletProvider: IIconWalletProvider,
    chainConfig: IconSpokeChainConfig,
    rpcUrl: HttpUrl = 'https://ctz.solidwallet.io/api/v3', // default to mainnet
    debugRpcUrl: HttpUrl = 'https://ctz.solidwallet.io/api/v3d', // default to mainnet
  ) {
    super(chainConfig, rpcUrl, debugRpcUrl);
    this.walletProvider = walletProvider;
  }
}

export class IconRawSpokeProvider extends IconBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(chainConfig: IconSpokeChainConfig, walletAddress: string) {
    super(chainConfig);
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
    };
  }
}

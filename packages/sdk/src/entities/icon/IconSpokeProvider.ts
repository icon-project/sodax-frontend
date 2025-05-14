import type { IconSpokeChainConfig } from '../../types.js';
import type { IconWalletProvider } from './IconWalletProvider.js';

export class IconSpokeProvider {
  public readonly walletProvider: IconWalletProvider;
  public readonly chainConfig: IconSpokeChainConfig;

  constructor(walletProvider: IconWalletProvider, chainConfig: IconSpokeChainConfig) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
  }
}

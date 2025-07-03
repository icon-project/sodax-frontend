import type { SolanaSpokeChainConfig } from '../../types.js';
import type { ISolanaWalletProvider } from '@sodax/types';
import type { ISpokeProvider } from '../index.js';

export class SolanaSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: ISolanaWalletProvider;
  public readonly chainConfig: SolanaSpokeChainConfig;

  constructor(walletProvider: ISolanaWalletProvider, chainConfig: SolanaSpokeChainConfig) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
  }
}

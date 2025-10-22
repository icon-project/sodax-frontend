import type { ISolanaWalletProvider, SolanaChainConfig } from '@sodax/types';
import type { ISpokeProvider } from '../index.js';

export class SolanaSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: ISolanaWalletProvider;
  public readonly chainConfig: SolanaChainConfig;

  constructor(walletProvider: ISolanaWalletProvider, chainConfig: SolanaChainConfig) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
  }
}

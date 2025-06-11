import type { SolanaWalletProvider } from './SolanaWalletProvider.js';
import type { ISpokeProvider } from '../index.js';
import type { SolanaChainConfig } from '@sodax/types';

export class SolanaSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: SolanaWalletProvider;
  public readonly chainConfig: SolanaChainConfig;

  constructor(walletProvider: SolanaWalletProvider, chainConfig: SolanaChainConfig) {
    this.walletProvider = walletProvider;
    this.chainConfig = chainConfig;
  }
}

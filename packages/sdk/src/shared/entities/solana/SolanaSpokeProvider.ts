import type { ISolanaWalletProvider, SolanaChainConfig, WalletAddressProvider } from '@sodax/types';
import type { IRawSpokeProvider, ISpokeProvider } from '../index.js';

export class SolanaBaseSpokeProvider {
  public readonly chainConfig: SolanaChainConfig;

  constructor(chainConfig: SolanaChainConfig) {
    this.chainConfig = chainConfig;
  }
}

export class SolanaSpokeProvider extends SolanaBaseSpokeProvider implements ISpokeProvider {
  public readonly walletProvider: ISolanaWalletProvider;

  constructor(walletProvider: ISolanaWalletProvider, chainConfig: SolanaChainConfig) {
    super(chainConfig);
    this.walletProvider = walletProvider;
  }
}

export class SolanaRawSpokeProvider extends SolanaBaseSpokeProvider implements IRawSpokeProvider {
  public readonly walletProvider: WalletAddressProvider;
  public readonly raw = true;

  constructor(walletAddress: string, chainConfig: SolanaChainConfig) {
    super(chainConfig);
    this.walletProvider = {
      getWalletAddress: async () => walletAddress,
    };
  }
}

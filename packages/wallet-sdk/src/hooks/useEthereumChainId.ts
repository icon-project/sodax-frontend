import type { InjectiveXService } from '@/xchains/injective';
import { Wallet } from '@injectivelabs/wallet-ts';
import React from 'react';
import { useEffect } from 'react';
import { useXService } from './useXService';

/**
 * React hook that returns the current Ethereum chain ID when using MetaMask wallet for Injective.
 * Listens for chain changes and updates the state accordingly.
 *
 * @remarks
 * This hook only works with MetaMask wallet and requires the window.ethereum provider to be available.
 * For other wallets or when MetaMask is not available, it returns null.
 *
 * @returns The current Ethereum chain ID as a number, or null if not available/connected
 */
export default function useEthereumChainId(): number | null {
  const injectiveXService = useXService('INJECTIVE') as unknown as InjectiveXService;
  const [ethereumChainId, setEthereumChainId] = React.useState<number | null>(null);
  useEffect(() => {
    if (!injectiveXService) {
      return;
    }

    const walletStrategy = injectiveXService.walletStrategy;
    const metamaskProvider = (window as any).ethereum as any;

    if (!metamaskProvider) {
      return;
    }

    const getEthereumChainId = async () => {
      if (walletStrategy.getWallet() === Wallet.Metamask) {
        const chainId = await walletStrategy.getEthereumChainId();
        setEthereumChainId(Number.parseInt(chainId));
      }
    };
    if (walletStrategy.getWallet() === Wallet.Metamask) {
      metamaskProvider.on('chainChanged', getEthereumChainId);
      getEthereumChainId();
    }
    return () => {
      metamaskProvider.off('chainChanged', getEthereumChainId);
    };
  }, [injectiveXService]);

  return ethereumChainId;
}

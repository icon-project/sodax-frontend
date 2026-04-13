import type { InjectiveXService } from '@/xchains/injective';
import { Wallet } from '@injectivelabs/wallet-base';
import { useEffect, useState } from 'react';
import { useXService } from './useXService';
import type { EvmWalletStrategy } from '@injectivelabs/wallet-evm';

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
  const [ethereumChainId, setEthereumChainId] = useState<number | null>(null);
  useEffect(() => {
    if (!injectiveXService?.walletStrategy?.getWallet()) return;
    const walletStrategy = injectiveXService.walletStrategy;
    if (walletStrategy.getWallet() !== Wallet.Metamask) return;

    const getEthereumChainId = async () => {
      try {
        const chainId = await walletStrategy.getEthereumChainId();
        setEthereumChainId(Number.parseInt(chainId));
      } catch (e) {
        console.warn('Failed to get Ethereum chain ID:', e);
      }
    };
    getEthereumChainId();

    try {
      (walletStrategy.getStrategy() as EvmWalletStrategy).onChainIdChanged(getEthereumChainId);
    } catch (e) {
      console.warn('Failed to subscribe to chain ID changes:', e);
    }
  }, [injectiveXService?.walletStrategy]);

  return ethereumChainId;
}

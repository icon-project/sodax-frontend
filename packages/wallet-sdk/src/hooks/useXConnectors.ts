import type { XChainType } from '@/types';
import { useWallets } from '@mysten/dapp-kit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useMemo } from 'react';
import { useConnectors } from 'wagmi';
import type { XConnector } from '../core';
import { EvmXConnector } from '../xchains/evm';
import { SolanaXConnector } from '../xchains/solana';
import { useStellarXConnectors } from '../xchains/stellar/useStellarXConnectors';
import { SuiXConnector } from '../xchains/sui';
import { useXService } from './useXService';

/**
 * Hook to retrieve available wallet connectors for a specific blockchain type.
 *
 * This hook aggregates wallet connectors from different blockchain ecosystems:
 * - EVM: Uses wagmi connectors
 * - Sui: Uses Sui wallet adapters
 * - Stellar: Uses custom Stellar connectors
 * - Solana: Uses Solana wallet adapters (filtered to installed wallets only)
 *
 * @param xChainType - The blockchain type to get connectors for ('EVM' | 'SUI' | 'STELLAR' | 'SOLANA')
 * @returns An array of XConnector instances compatible with the specified chain type
 */

export function useXConnectors(xChainType: XChainType | undefined): XConnector[] {
  const xService = useXService(xChainType);
  const evmConnectors = useConnectors();
  const suiWallets = useWallets();
  const { data: stellarXConnectors } = useStellarXConnectors();

  const { wallets: solanaWallets } = useWallet();

  const xConnectors = useMemo((): XConnector[] => {
    if (!xChainType || !xService) {
      return [];
    }

    switch (xChainType) {
      case 'EVM':
        return evmConnectors.map(connector => new EvmXConnector(connector));
      case 'SUI':
        return suiWallets.map(wallet => new SuiXConnector(wallet));
      case 'STELLAR':
        return stellarXConnectors || [];
      case 'SOLANA':
        return solanaWallets
          .filter(wallet => wallet.readyState === 'Installed')
          .map(wallet => new SolanaXConnector(wallet));
      default:
        return xService.getXConnectors();
    }
  }, [xService, xChainType, evmConnectors, suiWallets, stellarXConnectors, solanaWallets]);

  return xConnectors;
}

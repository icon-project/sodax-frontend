import { useCallback, useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { baseChainInfo, type ChainId } from '@sodax/types';
import { getXChainType } from '@/actions';
import type { InjectiveXService } from '@/xchains/injective';
import { useXService } from '@/hooks/useXService';
import useEthereumChainId from './useEthereumChainId';
import { mainnet } from 'viem/chains';
import { Wallet } from '@injectivelabs/wallet-base';

interface UseEvmSwitchChainReturn {
  isWrongChain: boolean;
  handleSwitchChain: () => void;
}

/**
 * Hook to handle EVM chain switching functionality
 *
 * @param expectedXChainId - The target chain ID to switch to (e.g. '0xa.optimism', '0x89.polygon')
 * @returns {Object} Object containing:
 *   - isWrongChain: boolean indicating if current chain differs from expected chain
 *   - handleSwitchChain: function to trigger chain switch to expected chain
 *
 * @example
 * ```tsx
 * function ChainSwitchButton({ targetChain }: { targetChain: ChainId }) {
 *   const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(targetChain);
 *
 *   return (
 *     <Button onClick={handleSwitchChain} disabled={!isWrongChain}>
 *       Switch Network
 *     </Button>
 *   );
 * }
 * ```
 */

export const switchEthereumChain = async () => {
  const metamaskProvider = (window as any).ethereum as any;

  return await Promise.race([
    metamaskProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    }),
    new Promise<void>(resolve =>
      metamaskProvider.on('change', ({ chain }: { chain: { id: number } }) => {
        if (chain?.id === 1) {
          resolve();
        }
      }),
    ),
  ]);
};

export const useEvmSwitchChain = (expectedXChainId: ChainId): UseEvmSwitchChainReturn => {
  const xChainType = getXChainType(expectedXChainId);
  const expectedChainId = baseChainInfo[expectedXChainId].chainId as number;

  const injectiveXService = useXService('INJECTIVE') as unknown as InjectiveXService;
  const ethereumChainId = useEthereumChainId();

  const { chainId } = useAccount();
  const isWrongChain = useMemo(() => {
    return (
      (xChainType === 'EVM' && chainId !== expectedChainId) ||
      (xChainType === 'INJECTIVE' &&
        injectiveXService &&
        injectiveXService.walletStrategy.getWallet() === Wallet.Metamask &&
        ethereumChainId !== mainnet.id)
    );
  }, [xChainType, chainId, expectedChainId, ethereumChainId, injectiveXService]);

  const { switchChain } = useSwitchChain();

  const handleSwitchChain = useCallback(() => {
    if (xChainType === 'INJECTIVE') {
      switchEthereumChain();
    } else {
      switchChain({ chainId: expectedChainId });
    }
  }, [switchChain, expectedChainId, xChainType]);

  return useMemo(
    () => ({
      isWrongChain,
      handleSwitchChain,
    }),
    [isWrongChain, handleSwitchChain],
  );
};

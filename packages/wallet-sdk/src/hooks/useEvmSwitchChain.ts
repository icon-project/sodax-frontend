import { xChainMap } from '@/constants/xChains';
import { useCallback, useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import type { ChainId } from '@sodax/types';
import { getXChainType } from '@/actions';

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

export const useEvmSwitchChain = (expectedXChainId: ChainId): UseEvmSwitchChainReturn => {
  const xChainType = getXChainType(expectedXChainId);
  const expectedChainId = xChainMap[expectedXChainId].id as number;

  const { chainId } = useAccount();
  const isWrongChain = useMemo(() => {
    return xChainType === 'EVM' && chainId !== expectedChainId;
  }, [xChainType, chainId, expectedChainId]);

  const { switchChain } = useSwitchChain();

  const handleSwitchChain = useCallback(() => {
    switchChain({ chainId: expectedChainId });
  }, [switchChain, expectedChainId]);

  return useMemo(
    () => ({
      isWrongChain,
      handleSwitchChain,
    }),
    [isWrongChain, handleSwitchChain],
  );
};

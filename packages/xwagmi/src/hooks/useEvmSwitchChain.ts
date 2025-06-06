import { xChainMap } from '@/constants/xChains';
import { useCallback, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useSwitchChain } from 'wagmi';
import { type XChainId, getXChainType } from '..';

export const useEvmSwitchChain = (expectedXChainId: XChainId) => {
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

  return { isWrongChain, handleSwitchChain };
};

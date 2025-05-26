import {
  isEvmSpokeChainConfig,
  type SpokeChainId,
  spokeChainConfig,
  type EvmChainId,
  getEvmViemChain,
} from '@new-world/sdk';
import { useEffect, useState } from 'react';
import { useSwitchChain } from 'wagmi';

export function useSwitchWalletChain(initialChainId: SpokeChainId) {
  const [walletChainId, setWalletChainId] = useState<SpokeChainId>(initialChainId);
  const { switchChain: switchEvmChain } = useSwitchChain();

  useEffect(() => {
    if (isEvmSpokeChainConfig(spokeChainConfig[walletChainId])) {
      const viemChainId = getEvmViemChain(walletChainId as EvmChainId).id;
      switchEvmChain({ chainId: viemChainId });
    }

    throw new Error('[useSwitchWalletChain] Unsupported wallet chain id');
  }, [walletChainId, switchEvmChain]);

  return {
    walletChainId,
    setWalletChainId,
  };
}

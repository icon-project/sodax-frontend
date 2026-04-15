import { useCallback, useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { baseChainInfo, type ChainId } from '@sodax/types';
import { getXChainType } from '@/actions';
import type { InjectiveXService } from '@/xchains/injective';
import { useXService } from '@/hooks/useXService';
import { useIsChainEnabled } from '@/context/WalletConfigContext';
import useEthereumChainId from './useEthereumChainId';
import { mainnet } from 'viem/chains';
// EIP1193Provider is the standard interface for injected ethereum providers (MetaMask, etc).
// It types .request() for JSON-RPC calls and .on()/.removeListener() for events.
import type { EIP1193Provider } from 'viem';
import { Wallet } from '@injectivelabs/wallet-base';

interface UseEvmSwitchChainReturn {
  isWrongChain: boolean;
  handleSwitchChain: () => void;
}

const EVM_DISABLED_RESULT: UseEvmSwitchChainReturn = { isWrongChain: false, handleSwitchChain: () => {} };

export const switchEthereumChain = async () => {
  // window.ethereum is injected by wallet extensions. We cast to EIP1193Provider
  // (the EIP-1193 standard) which types .request() and .on() properly.
  const metamaskProvider = (window as unknown as { ethereum: EIP1193Provider }).ethereum;

  return await Promise.race([
    metamaskProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    }),
    new Promise<void>(resolve =>
      // EIP-1193 standard event: 'chainChanged' fires with a hex chain ID string.
      // The old code used 'change' with { chain: { id: number } } — not a real EIP-1193 event.
      metamaskProvider.on('chainChanged', (chainId: string) => {
        if (chainId === '0x1') {
          resolve();
        }
      }),
    ),
  ]);
};

/**
 * Hook to handle EVM chain switching functionality.
 * Safe to call when EVM is disabled — returns no-op values.
 *
 * Conditionally delegates to useEvmSwitchChainInner which uses wagmi hooks
 * (useAccount, useSwitchChain) that require WagmiProvider. When EVM is disabled,
 * WagmiProvider is not mounted, so we must not call those hooks.
 *
 * This technically violates Rules of Hooks (conditional hook call), but is safe
 * because `evmEnabled` is derived from config which is immutable after mount —
 * the branch never changes during the component's lifetime.
 */
export const useEvmSwitchChain = (expectedXChainId: ChainId): UseEvmSwitchChainReturn => {
  const evmEnabled = useIsChainEnabled('EVM');

  if (!evmEnabled) {
    return EVM_DISABLED_RESULT;
  }

  return useEvmSwitchChainInner(expectedXChainId);
};

const useEvmSwitchChainInner = (expectedXChainId: ChainId): UseEvmSwitchChainReturn => {
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

import { useCallback, useMemo } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { baseChainInfo, type ChainId } from '@sodax/types';
import { getXChainType } from '@/actions/index.js';
import { InjectiveXService } from '@/xchains/injective/index.js';
import { useXService } from '@/hooks/useXService.js';
import { useIsChainEnabled } from '@/context/WalletConfigContext.js';
import useEthereumChainId from './useEthereumChainId.js';
import { mainnet } from 'viem/chains';
// EIP1193Provider is the standard interface for injected ethereum providers (MetaMask, etc).
// It types .request() for JSON-RPC calls and .on()/.removeListener() for events.
import type { EIP1193Provider } from 'viem';
import { Wallet } from '@injectivelabs/wallet-base';
import { assert, hasFunctionProperty, isRecord } from '@/shared/guards.js';

interface UseEvmSwitchChainReturn {
  isWrongChain: boolean;
  handleSwitchChain: () => void;
}

const EVM_DISABLED_RESULT: UseEvmSwitchChainReturn = { isWrongChain: false, handleSwitchChain: () => {} };

const isEip1193Provider = (value: unknown): value is EIP1193Provider => {
  return isRecord(value) && hasFunctionProperty(value, 'request') && hasFunctionProperty(value, 'on');
};

const getInjectedEthereumProvider = (): EIP1193Provider => {
  const maybeEthereum = (window as unknown as Record<string, unknown>).ethereum;
  assert(isEip1193Provider(maybeEthereum), '[useEvmSwitchChain] window.ethereum is not an EIP-1193 provider');
  return maybeEthereum;
};

const isInjectiveXService = (value: unknown): value is InjectiveXService => {
  return typeof value === 'object' && value !== null && value instanceof InjectiveXService;
};

export const switchEthereumChain = async (): Promise<unknown> => {
  const metamaskProvider = getInjectedEthereumProvider();

  return await Promise.race([
    metamaskProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }],
    }),
    new Promise<void>(resolve => {
      // EIP-1193 standard event: 'chainChanged' fires with a hex chain ID string.
      // The old code used 'change' with { chain: { id: number } } — not a real EIP-1193 event.
      const handler = (chainId: string) => {
        if (chainId === '0x1') {
          metamaskProvider.removeListener('chainChanged', handler);
          resolve();
        }
      };
      metamaskProvider.on('chainChanged', handler);
    }),
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
  const expectedChainId = baseChainInfo[expectedXChainId].chainId;
  assert(typeof expectedChainId === 'number', '[useEvmSwitchChain] expected numeric EVM chainId');

  const xService = useXService('INJECTIVE');
  const injectiveXService = isInjectiveXService(xService) ? xService : undefined;
  const ethereumChainId = useEthereumChainId();

  const { chainId } = useAccount();
  const isWrongChain = useMemo(() => {
    return (
      (xChainType === 'EVM' && chainId !== expectedChainId) ||
      (xChainType === 'INJECTIVE' &&
        injectiveXService !== undefined &&
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

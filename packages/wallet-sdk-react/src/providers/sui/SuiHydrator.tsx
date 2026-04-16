import { useEffect, useMemo, useRef } from 'react';
import { useCurrentAccount, useCurrentWallet, useSuiClient, useWallets } from '@mysten/dapp-kit';
import { SuiWalletProvider } from '@sodax/wallet-sdk-core';
import { SuiXService, SuiXConnector } from '../../xchains/sui/index.js';
import { useXWalletStore } from '../../useXWalletStore.js';
import { assertSuiProviderShape } from '@/shared/guards.js';

/**
 * Hydrates SUI state from @mysten/dapp-kit hooks into SuiXService singleton and store.
 */
export const SuiHydrator = (): null => {
  const suiClient = useSuiClient();
  const { currentWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  const suiWallets = useWallets();
  const setXConnection = useXWalletStore(state => state.setXConnection);
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);
  const setWalletProvider = useXWalletStore(state => state.setWalletProvider);

  // Sync dapp-kit values into the SuiXService singleton in a single effect.
  // The singleton is read by SuiXService.createWalletProvider() and balance methods.
  useEffect(() => {
    const service = SuiXService.getInstance();
    if (suiClient) service.suiClient = suiClient;
    if (currentWallet) service.suiWallet = currentWallet;
    if (suiAccount) service.suiAccount = suiAccount;
  }, [suiClient, currentWallet, suiAccount]);

  // Memoize the connector list — useWallets returns a new array reference even when the
  // underlying wallet set hasn't changed. Without memoization, every render would create
  // new XConnector instances and trigger downstream re-renders.
  const suiConnectors = useMemo(() => suiWallets.map(wallet => new SuiXConnector(wallet)), [suiWallets]);
  useEffect(() => {
    SuiXService.getInstance().setXConnectors(suiConnectors);
    useXWalletStore.getState().setXConnectors('SUI', suiConnectors);
  }, [suiConnectors]);

  const wasConnectedRef = useRef(!!useXWalletStore.getState().xConnections.SUI);
  useEffect(() => {
    if (currentWallet && suiAccount?.address) {
      wasConnectedRef.current = true;
      setXConnection('SUI', {
        xAccount: { address: suiAccount.address, xChainType: 'SUI' },
        xConnectorId: currentWallet.name,
      });
    } else if (wasConnectedRef.current) {
      wasConnectedRef.current = false;
      unsetXConnection('SUI');
    }
  }, [currentWallet, suiAccount, setXConnection, unsetXConnection]);

  // Create wallet provider directly from hook values (not singleton) — useMemo runs during
  // render, before the useEffect that syncs values into the singleton. Reading from the
  // singleton here would use stale fields from the previous render.
  const walletProvider = useMemo(() => {
    if (suiClient && currentWallet && suiAccount) {
      assertSuiProviderShape('SuiHydrator', suiClient, currentWallet, suiAccount);

      // @mysten/dapp-kit and wallet-sdk-core may resolve different @mysten/sui versions.
      // The types are structurally identical but nominally different.
      // `as unknown as T` documents a known, intentional version-mismatch cast —
      // unlike `as any`, it doesn't silence unrelated type errors.
      type SuiWalletProviderConfig = ConstructorParameters<typeof SuiWalletProvider>[0];
      return new SuiWalletProvider({
        client: suiClient,
        wallet: currentWallet,
        account: suiAccount,
      } as unknown as SuiWalletProviderConfig);
    }
    return undefined;
  }, [suiClient, currentWallet, suiAccount]);

  useEffect(() => {
    setWalletProvider('SUI', walletProvider);
  }, [walletProvider, setWalletProvider]);

  return null;
};

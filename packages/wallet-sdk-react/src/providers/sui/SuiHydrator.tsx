'use client';

import { useEffect, useRef } from 'react';
import { useCurrentAccount, useCurrentWallet, useSuiClient, useWallets } from '@mysten/dapp-kit';
import { SuiXService } from '../../xchains/sui';
import { SuiXConnector } from '../../xchains/sui';
import { useXWalletStore } from '../../useXWalletStore';

/**
 * Hydrates SUI state from @mysten/dapp-kit hooks into SuiXService singleton and store.
 */
export const SuiHydrator = () => {
  const suiClient = useSuiClient();
  const { currentWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  const suiWallets = useWallets();
  const setXConnection = useXWalletStore(state => state.setXConnection);
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);

  useEffect(() => {
    if (suiClient) {
      SuiXService.getInstance().suiClient = suiClient;
    }
  }, [suiClient]);

  useEffect(() => {
    if (currentWallet) {
      SuiXService.getInstance().suiWallet = currentWallet;
    }
  }, [currentWallet]);

  useEffect(() => {
    if (suiAccount) {
      SuiXService.getInstance().suiAccount = suiAccount;
    }
  }, [suiAccount]);

  useEffect(() => {
    const suiConnectors = suiWallets.map(wallet => new SuiXConnector(wallet));
    SuiXService.getInstance().setXConnectors(suiConnectors);
    useXWalletStore.getState().setXConnectors('SUI', suiConnectors);
  }, [suiWallets]);

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

  return null;
};

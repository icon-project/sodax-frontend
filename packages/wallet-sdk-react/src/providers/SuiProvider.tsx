'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React, { useEffect } from 'react';
import {
  SuiClientProvider,
  WalletProvider as SuiWalletProvider,
  useCurrentAccount,
  useCurrentWallet,
  useSuiClient,
  useConnectWallet,
  useDisconnectWallet,
  useWallets,
  useSignPersonalMessage,
} from '@mysten/dapp-kit';
import { getFullnodeUrl } from '@mysten/sui/client';
import type { XConnection } from '../types';
import type { ChainActions } from '../context/ChainActionsContext';
import { SuiXService } from '../xchains/sui';
import { SuiXConnector } from '../xchains/sui';
import { useXWagmiStore } from '../useXWagmiStore';
import type { SuiChainConfig } from '../types/config';

const defaultSuiConfig: Required<Pick<SuiChainConfig, 'autoConnect'>> = {
  autoConnect: true,
};

type SuiProviderProps = {
  children: React.ReactNode;
  config?: SuiChainConfig;
  onRegisterActions: (actions: ChainActions) => void;
};

/**
 * Hydrates SUI state from @mysten/dapp-kit hooks into SuiXService singleton and store.
 * Registers SUI ChainActions.
 */
const SuiHydrator = ({ onRegisterActions }: Pick<SuiProviderProps, 'onRegisterActions'>) => {
  const suiClient = useSuiClient();
  const { currentWallet } = useCurrentWallet();
  const suiAccount = useCurrentAccount();
  const suiWallets = useWallets();
  const { mutateAsync: suiConnectAsync } = useConnectWallet();
  const { mutateAsync: suiDisconnectAsync } = useDisconnectWallet();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const setXConnection = useXWagmiStore(state => state.setXConnection);
  const unsetXConnection = useXWagmiStore(state => state.unsetXConnection);

  // Hydrate suiClient into singleton
  useEffect(() => {
    if (suiClient) {
      SuiXService.getInstance().suiClient = suiClient;
    }
  }, [suiClient]);

  // Hydrate suiWallet into singleton
  useEffect(() => {
    if (currentWallet) {
      SuiXService.getInstance().suiWallet = currentWallet;
    }
  }, [currentWallet]);

  // Hydrate suiAccount into singleton
  useEffect(() => {
    if (suiAccount) {
      SuiXService.getInstance().suiAccount = suiAccount;
    }
  }, [suiAccount]);

  // Hydrate connectors into store
  useEffect(() => {
    const suiConnectors = suiWallets.map(wallet => new SuiXConnector(wallet));
    SuiXService.getInstance().setXConnectors(suiConnectors);
    useXWagmiStore.getState().setXConnectors('SUI', suiConnectors);
  }, [suiWallets]);

  // Hydrate connection state into store
  useEffect(() => {
    if (currentWallet && suiAccount?.address) {
      setXConnection('SUI', {
        xAccount: { address: suiAccount.address, xChainType: 'SUI' },
        xConnectorId: currentWallet.name,
      });
    }
  }, [currentWallet, suiAccount, setXConnection]);

  // Register ChainActions
  useEffect(() => {
    const actions: ChainActions = {
      connect: async (xConnectorId: string) => {
        const wallet = suiWallets.find(w => w.name === xConnectorId);
        if (!wallet) return undefined;
        await suiConnectAsync({ wallet });
        // Connection state hydrated via useCurrentAccount/useCurrentWallet effects above
        return undefined;
      },
      disconnect: async () => {
        await suiDisconnectAsync();
        unsetXConnection('SUI');
      },
      getConnectors: () => SuiXService.getInstance().getXConnectors(),
      getConnection: (): XConnection | undefined => {
        return useXWagmiStore.getState().xConnections.SUI;
      },
      signMessage: async (message: string) => {
        const res = await signPersonalMessage({ message: new Uint8Array(new TextEncoder().encode(message)) });
        return res.signature;
      },
    };
    onRegisterActions(actions);
  }, [suiWallets, suiConnectAsync, suiDisconnectAsync, signPersonalMessage, unsetXConnection, onRegisterActions]);

  return null;
};

export const SuiProvider = ({ children, config, onRegisterActions }: SuiProviderProps) => {
  const autoConnect = config?.autoConnect ?? defaultSuiConfig.autoConnect;

  return (
    <SuiClientProvider networks={{ mainnet: { url: getFullnodeUrl('mainnet') } }} defaultNetwork="mainnet">
      <SuiWalletProvider autoConnect={autoConnect}>
        <SuiHydrator onRegisterActions={onRegisterActions} />
        {children}
      </SuiWalletProvider>
    </SuiClientProvider>
  );
};

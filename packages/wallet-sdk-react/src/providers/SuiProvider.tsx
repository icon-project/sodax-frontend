'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React, { useEffect, useRef } from 'react';
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
import { useXWalletStore } from '../useXWalletStore';
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
  const setXConnection = useXWalletStore(state => state.setXConnection);
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);

  // Refs to hold latest hook values
  const connectRef = useRef(suiConnectAsync);
  const disconnectRef = useRef(suiDisconnectAsync);
  const signMessageRef = useRef(signPersonalMessage);
  const unsetConnectionRef = useRef(unsetXConnection);
  const walletsRef = useRef(suiWallets);

  useEffect(() => { connectRef.current = suiConnectAsync; }, [suiConnectAsync]);
  useEffect(() => { disconnectRef.current = suiDisconnectAsync; }, [suiDisconnectAsync]);
  useEffect(() => { signMessageRef.current = signPersonalMessage; }, [signPersonalMessage]);
  useEffect(() => { unsetConnectionRef.current = unsetXConnection; }, [unsetXConnection]);
  useEffect(() => { walletsRef.current = suiWallets; }, [suiWallets]);

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
    useXWalletStore.getState().setXConnectors('SUI', suiConnectors);
  }, [suiWallets]);

  // Hydrate connection state into store (set + unset)
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

  // Register ChainActions — once on mount, uses refs for latest values
  useEffect(() => {
    const actions: ChainActions = {
      connect: async (xConnectorId: string) => {
        const wallet = walletsRef.current.find(w => w.name === xConnectorId);
        if (!wallet) return undefined;
        await connectRef.current({ wallet });
        return undefined;
      },
      disconnect: async () => {
        await disconnectRef.current();
        unsetConnectionRef.current('SUI');
      },
      getConnectors: () => SuiXService.getInstance().getXConnectors(),
      getConnection: (): XConnection | undefined => {
        return useXWalletStore.getState().xConnections.SUI;
      },
      signMessage: async (message: string) => {
        const res = await signMessageRef.current({ message: new Uint8Array(new TextEncoder().encode(message)) });
        return res.signature;
      },
    };
    onRegisterActions(actions);
  }, [onRegisterActions]);

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

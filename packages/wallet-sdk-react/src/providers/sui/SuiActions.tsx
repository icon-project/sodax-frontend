'use client';

import { useEffect, useRef } from 'react';
import { useConnectWallet, useDisconnectWallet, useWallets, useSignPersonalMessage } from '@mysten/dapp-kit';
import type { XConnection } from '../../types';
import type { ChainActions } from '../../context/ChainActionsContext';
import { SuiXService } from '../../xchains/sui';
import { useXWalletStore } from '../../useXWalletStore';

type SuiActionsProps = {
  onRegisterActions: (actions: ChainActions) => void;
};

/**
 * Registers SUI ChainActions into the registry.
 */
export const SuiActions = ({ onRegisterActions }: SuiActionsProps) => {
  const suiWallets = useWallets();
  const { mutateAsync: suiConnectAsync } = useConnectWallet();
  const { mutateAsync: suiDisconnectAsync } = useDisconnectWallet();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);

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

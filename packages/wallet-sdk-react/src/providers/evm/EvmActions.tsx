'use client';

import { useEffect, useRef } from 'react';
import { useConfig, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import type { XConnection } from '../../types';
import type { ChainActions } from '../../context/ChainActionsContext';
import { EvmXService } from '../../xchains/evm/EvmXService';
import { useXWalletStore } from '../../useXWalletStore';

type EvmActionsProps = {
  onRegisterActions: (actions: ChainActions) => void;
};

/**
 * Registers EVM ChainActions into the registry.
 * Uses refs to hold latest wagmi hook values — registers once on mount.
 */
export const EvmActions = ({ onRegisterActions }: EvmActionsProps) => {
  const wagmiConfig = useConfig();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);

  const connectRef = useRef(connectAsync);
  const disconnectRef = useRef(disconnectAsync);
  const signMessageRef = useRef(signMessageAsync);
  const unsetConnectionRef = useRef(unsetXConnection);
  const wagmiConfigRef = useRef(wagmiConfig);

  useEffect(() => { connectRef.current = connectAsync; }, [connectAsync]);
  useEffect(() => { disconnectRef.current = disconnectAsync; }, [disconnectAsync]);
  useEffect(() => { signMessageRef.current = signMessageAsync; }, [signMessageAsync]);
  useEffect(() => { unsetConnectionRef.current = unsetXConnection; }, [unsetXConnection]);
  useEffect(() => { wagmiConfigRef.current = wagmiConfig; }, [wagmiConfig]);

  useEffect(() => {
    const actions: ChainActions = {
      connect: async (xConnectorId: string) => {
        const connector = wagmiConfigRef.current.connectors.find(c => c.id === xConnectorId);
        if (!connector) return undefined;
        await connectRef.current({ connector });
        return undefined;
      },
      disconnect: async () => {
        await disconnectRef.current();
        unsetConnectionRef.current('EVM');
      },
      getConnectors: () => EvmXService.getInstance().getXConnectors(),
      getConnection: (): XConnection | undefined => {
        return useXWalletStore.getState().xConnections.EVM;
      },
      signMessage: async (message: string) => {
        const signature = await signMessageRef.current({ message });
        return signature;
      },
    };
    onRegisterActions(actions);
  }, [onRegisterActions]);

  return null;
};

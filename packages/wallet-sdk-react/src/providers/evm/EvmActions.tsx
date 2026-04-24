import { useEffect, useRef } from 'react';
import { useConfig, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { EvmXService } from '../../xchains/evm/EvmXService.js';
import { useXWalletStore } from '../../useXWalletStore.js';

/**
 * Registers EVM ChainActions into the store.
 * Uses refs to hold latest wagmi hook values — registers once on mount.
 */
export const EvmActions = () => {
  const wagmiConfig = useConfig();
  const { connectAsync } = useConnect();
  const { disconnectAsync } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const registerChainActions = useXWalletStore(state => state.registerChainActions);

  const connectRef = useRef(connectAsync);
  const disconnectRef = useRef(disconnectAsync);
  const signMessageRef = useRef(signMessageAsync);
  const wagmiConfigRef = useRef(wagmiConfig);

  // Sync all wagmi hook refs in a single effect to avoid 4 separate effect commits per render.
  useEffect(() => {
    connectRef.current = connectAsync;
    disconnectRef.current = disconnectAsync;
    signMessageRef.current = signMessageAsync;
    wagmiConfigRef.current = wagmiConfig;
  }, [connectAsync, disconnectAsync, signMessageAsync, wagmiConfig]);

  useEffect(() => {
    registerChainActions('EVM', {
      connect: async (xConnectorId: string) => {
        const connector = wagmiConfigRef.current.connectors.find(c => c.id === xConnectorId);
        if (!connector) {
          console.warn(
            `[EvmActions] connect: connector "${xConnectorId}" not found in wagmi config`,
            wagmiConfigRef.current.connectors.map(c => c.id),
          );
          return undefined;
        }
        await connectRef.current({ connector });
        // EVM connection state is set by EvmHydrator (single writer for provider-managed chains)
        return undefined;
      },
      disconnect: async () => {
        await disconnectRef.current();
        // EVM disconnection state is cleared by EvmHydrator (single writer for provider-managed chains)
      },
      getConnectors: () => EvmXService.getInstance().getXConnectors(),
      getConnection: () => useXWalletStore.getState().xConnections.EVM,
      signMessage: async (message: string) => {
        const signature = await signMessageRef.current({ message });
        return signature;
      },
    });
  }, [registerChainActions]);

  return null;
};

import { useEffect, useRef } from 'react';
import { useConnectWallet, useDisconnectWallet, useWallets, useSignPersonalMessage } from '@mysten/dapp-kit';
import { SuiXService } from '../../xchains/sui';
import { useXWalletStore } from '../../useXWalletStore';

/**
 * Registers SUI ChainActions into the store.
 */
export const SuiActions = () => {
  const suiWallets = useWallets();
  const { mutateAsync: suiConnectAsync } = useConnectWallet();
  const { mutateAsync: suiDisconnectAsync } = useDisconnectWallet();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const registerChainActions = useXWalletStore(state => state.registerChainActions);

  const connectRef = useRef(suiConnectAsync);
  const disconnectRef = useRef(suiDisconnectAsync);
  const signMessageRef = useRef(signPersonalMessage);
  const walletsRef = useRef(suiWallets);

  useEffect(() => { connectRef.current = suiConnectAsync; }, [suiConnectAsync]);
  useEffect(() => { disconnectRef.current = suiDisconnectAsync; }, [suiDisconnectAsync]);
  useEffect(() => { signMessageRef.current = signPersonalMessage; }, [signPersonalMessage]);
  useEffect(() => { walletsRef.current = suiWallets; }, [suiWallets]);

  useEffect(() => {
    registerChainActions('SUI', {
      connect: async (xConnectorId: string) => {
        const wallet = walletsRef.current.find(w => w.name === xConnectorId);
        if (!wallet) {
          console.warn(
            `[SuiActions] connect: wallet "${xConnectorId}" not found in adapter list`,
            walletsRef.current.map(w => w.name),
          );
          return undefined;
        }
        await connectRef.current({ wallet });
        return undefined;
      },
      disconnect: async () => {
        await disconnectRef.current();
        // SUI disconnection state is cleared by SuiHydrator (single writer for provider-managed chains)
      },
      getConnectors: () => SuiXService.getInstance().getXConnectors(),
      getConnection: () => useXWalletStore.getState().xConnections.SUI,
      signMessage: async (message: string) => {
        const res = await signMessageRef.current({ message: new Uint8Array(new TextEncoder().encode(message)) });
        return res.signature;
      },
    });
  }, [registerChainActions]);

  return null;
};

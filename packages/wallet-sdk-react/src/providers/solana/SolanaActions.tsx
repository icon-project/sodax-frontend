import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaXService } from '../../xchains/solana/SolanaXService';
import { useXWalletStore } from '../../useXWalletStore';
import { SOLANA_METAMASK_CONNECT_TIMEOUT_MS } from '../../constants';

/**
 * Registers Solana ChainActions into the store.
 *
 * Connect strategy (unified for all Solana wallets including MetaMask):
 * 1. select() tells wallet-adapter-react which wallet to use.
 * 2. If already connected (autoConnect on refresh), skip.
 * 3. Listen for adapter 'connect'/'error' events first.
 * 4. Trigger walletRef.current.connect() after a tick (React needs to flush select() state).
 * 5. Resolve/reject based on adapter events — no timing dependency.
 */
export const SolanaActions = () => {
  const solanaWallet = useWallet();
  const registerChainActions = useXWalletStore(state => state.registerChainActions);

  const walletRef = useRef(solanaWallet);
  useEffect(() => { walletRef.current = solanaWallet; }, [solanaWallet]);

  useEffect(() => {
    registerChainActions('SOLANA', {
      connect: async (xConnectorId: string) => {
        const wallet = walletRef.current.wallets.find(w => w.adapter.name === xConnectorId);
        if (!wallet) {
          console.warn(
            `[SolanaActions] connect: wallet "${xConnectorId}" not found in adapter list`,
            walletRef.current.wallets.map(w => w.adapter.name),
          );
          return undefined;
        }

        walletRef.current.select(wallet.adapter.name);

        // Already connected (e.g. autoConnect on page refresh) — nothing to do
        if (wallet.adapter.connected) {
          return undefined;
        }

        // Event-driven connect: listen for result first, then trigger.
        // Works for all wallets (Phantom, MetaMask, etc.) without timing assumptions.
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Wallet connection timeout'));
          }, SOLANA_METAMASK_CONNECT_TIMEOUT_MS);

          const onConnect = () => { cleanup(); resolve(); };
          const onError = (err: Error) => { cleanup(); reject(err); };
          const cleanup = () => {
            clearTimeout(timeout);
            wallet.adapter.off('connect', onConnect);
            wallet.adapter.off('error', onError);
          };

          wallet.adapter.on('connect', onConnect);
          wallet.adapter.on('error', onError);

          // Yield one tick so React can flush select() state, then trigger connect
          // through React layer. If autoConnect is already connecting, skip — the
          // event listeners above will catch the result either way.
          setTimeout(() => {
            if (!wallet.adapter.connected && !wallet.adapter.connecting) {
              walletRef.current.connect().catch(err => { cleanup(); reject(err); });
            }
          }, 0);
        });

        return undefined;
      },
      disconnect: async () => {
        await walletRef.current.disconnect();
      },
      getConnectors: () => SolanaXService.getInstance().getXConnectors(),
      getConnection: () => useXWalletStore.getState().xConnections.SOLANA,
      signMessage: async (message: string) => {
        if (!walletRef.current.signMessage) {
          throw new Error('Solana wallet not connected');
        }
        const signature = await walletRef.current.signMessage(new TextEncoder().encode(message));
        return Buffer.from(signature).toString('base64');
      },
    });
  }, [registerChainActions]);

  return null;
};

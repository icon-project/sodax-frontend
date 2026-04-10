import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaXService } from '../../xchains/solana/SolanaXService';
import { useXWalletStore } from '../../useXWalletStore';
import { SOLANA_METAMASK_CONNECT_TIMEOUT_MS } from '../../constants';

/**
 * Registers Solana ChainActions into the store.
 *
 * Connect strategy:
 * - select() tells wallet-adapter-react which wallet to use.
 * - Guard: if adapter is already connected (autoConnect on refresh) or connecting
 *   (autoConnect in progress), skip — no duplicate connect.
 * - Otherwise: adapter.connect() directly (bypasses React state, avoids
 *   WalletNotSelectedError from stale ref after select()).
 * - MetaMask: event-based adapter.connect() with timeout (adapter requires it).
 */
export const SolanaActions = () => {
  const solanaWallet = useWallet();
  const registerChainActions = useXWalletStore(state => state.registerChainActions);

  // Ref keeps latest useWallet() value for closures registered once via registerChainActions.
  // Without ref, closures would capture stale values from the initial render.
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

        // Check adapter directly (sync, source of truth) — NOT React state (async, stale in closures).
        // Covers: autoConnect already connected, autoConnect in progress, duplicate click.
        if (wallet.adapter.connected || wallet.adapter.connecting) {
          return undefined;
        }

        if (wallet.adapter.name === 'MetaMask') {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              cleanup();
              reject(new Error('Wallet connection timeout'));
            }, SOLANA_METAMASK_CONNECT_TIMEOUT_MS);

            const handleConnect = () => { cleanup(); resolve(); };
            const handleError = (error: Error) => { cleanup(); reject(error); };
            const cleanup = () => {
              clearTimeout(timeout);
              wallet.adapter.off('connect', handleConnect);
              wallet.adapter.off('error', handleError);
            };

            wallet.adapter.on('connect', handleConnect);
            wallet.adapter.on('error', handleError);
            wallet.adapter.connect().catch(err => { cleanup(); reject(err); });
          });
        } else {
          await wallet.adapter.connect();
        }

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

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaXService } from '../../xchains/solana/SolanaXService';
import { useXWalletStore } from '../../useXWalletStore';
import { SOLANA_METAMASK_CONNECT_TIMEOUT_MS } from '../../constants';

/**
 * Registers Solana ChainActions into the store.
 * Handles MetaMask timeout logic for Solana connect.
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

        if (wallet.adapter.name === 'MetaMask') {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              cleanup();
              reject(new Error('Wallet connection timeout'));
            }, SOLANA_METAMASK_CONNECT_TIMEOUT_MS);

            const handleConnect = () => {
              cleanup();
              resolve();
            };

            const handleError = (error: Error) => {
              cleanup();
              reject(error);
            };

            const cleanup = () => {
              clearTimeout(timeout);
              wallet.adapter.off('connect', handleConnect);
              wallet.adapter.off('error', handleError);
            };

            wallet.adapter.on('connect', handleConnect);
            wallet.adapter.on('error', handleError);

            walletRef.current.connect().catch(err => {
              cleanup();
              reject(err);
            });
          });
        } else if (!walletRef.current.connected) {
          // Use adapter.connect() directly — walletRef.current.connect() goes through
          // React state which may not have settled after select() yet, causing
          // WalletNotSelectedError.
          await wallet.adapter.connect();
        }

        return undefined;
      },
      disconnect: async () => {
        await walletRef.current.disconnect();
        // Solana disconnection state is cleared by SolanaHydrator (single writer for provider-managed chains)
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

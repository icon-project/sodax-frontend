'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { XConnection } from '../../types';
import { SolanaXService } from '../../xchains/solana/SolanaXService';
import { useXWalletStore } from '../../useXWalletStore';

/**
 * Registers Solana ChainActions into the store.
 * Handles MetaMask timeout logic for Solana connect.
 */
export const SolanaActions = () => {
  const solanaWallet = useWallet();
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);
  const registerChainActions = useXWalletStore(state => state.registerChainActions);

  const walletRef = useRef(solanaWallet);
  const unsetConnectionRef = useRef(unsetXConnection);

  useEffect(() => { walletRef.current = solanaWallet; }, [solanaWallet]);
  useEffect(() => { unsetConnectionRef.current = unsetXConnection; }, [unsetXConnection]);

  useEffect(() => {
    registerChainActions('SOLANA', {
      connect: async (xConnectorId: string) => {
        const wallet = walletRef.current.wallets.find(w => w.adapter.name === xConnectorId);
        if (!wallet) return undefined;

        walletRef.current.select(wallet.adapter.name);

        if (wallet.adapter.name === 'MetaMask') {
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              cleanup();
              reject(new Error('Wallet connection timeout'));
            }, 30000);

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
          await walletRef.current.connect();
        }

        return undefined;
      },
      disconnect: async () => {
        await walletRef.current.disconnect();
        unsetConnectionRef.current('SOLANA');
      },
      getConnectors: () => SolanaXService.getInstance().getXConnectors(),
      getConnection: (): XConnection | undefined => {
        return useXWalletStore.getState().xConnections.SOLANA;
      },
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

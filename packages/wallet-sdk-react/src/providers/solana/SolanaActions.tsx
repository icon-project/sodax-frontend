'use client';

import { useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import type { XConnection } from '../../types';
import type { ChainActions } from '../../context/ChainActionsContext';
import { SolanaXService } from '../../xchains/solana/SolanaXService';
import { useXWalletStore } from '../../useXWalletStore';

type SolanaActionsProps = {
  onRegisterActions: (actions: ChainActions) => void;
};

/**
 * Registers Solana ChainActions into the registry.
 * Handles MetaMask timeout logic for Solana connect.
 */
export const SolanaActions = ({ onRegisterActions }: SolanaActionsProps) => {
  const solanaWallet = useWallet();
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);

  const walletRef = useRef(solanaWallet);
  const unsetConnectionRef = useRef(unsetXConnection);

  useEffect(() => { walletRef.current = solanaWallet; }, [solanaWallet]);
  useEffect(() => { unsetConnectionRef.current = unsetXConnection; }, [unsetXConnection]);

  useEffect(() => {
    const actions: ChainActions = {
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
    };
    onRegisterActions(actions);
  }, [onRegisterActions]);

  return null;
};

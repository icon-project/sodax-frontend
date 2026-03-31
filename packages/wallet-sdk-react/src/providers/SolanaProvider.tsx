'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React, { useEffect, useMemo } from 'react';
import {
  ConnectionProvider as SolanaConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import { UnsafeBurnerWalletAdapter } from '@solana/wallet-adapter-wallets';
import type { RpcConfig } from '@sodax/types';
import type { XConnection } from '../types';
import type { ChainActions } from '../context/ChainActionsContext';
import { SolanaXService } from '../xchains/solana/SolanaXService';
import { SolanaXConnector } from '../xchains/solana';
import { useXWagmiStore } from '../useXWagmiStore';
import type { SolanaChainConfig } from '../types/config';

const defaultSolanaConfig: Required<Pick<SolanaChainConfig, 'autoConnect'>> = {
  autoConnect: true,
};

type SolanaProviderProps = {
  children: React.ReactNode;
  config?: SolanaChainConfig;
  rpcConfig?: RpcConfig;
  onRegisterActions: (actions: ChainActions) => void;
};

/**
 * Hydrates Solana state from @solana/wallet-adapter-react hooks into SolanaXService singleton and store.
 * Registers Solana ChainActions.
 */
const SolanaHydrator = ({ onRegisterActions }: Pick<SolanaProviderProps, 'onRegisterActions'>) => {
  const { connection } = useConnection();
  const solanaWallet = useWallet();
  const setXConnection = useXWagmiStore(state => state.setXConnection);
  const unsetXConnection = useXWagmiStore(state => state.unsetXConnection);

  // Hydrate connection into singleton
  useEffect(() => {
    if (connection) {
      SolanaXService.getInstance().connection = connection;
    }
  }, [connection]);

  // Hydrate wallet into singleton
  useEffect(() => {
    if (solanaWallet) {
      SolanaXService.getInstance().wallet = solanaWallet;
    }
  }, [solanaWallet]);

  // Hydrate connectors into store
  const solanaWallets = solanaWallet.wallets;
  useEffect(() => {
    const solanaConnectors = solanaWallets
      .filter(wallet => wallet.readyState === 'Installed')
      .map(wallet => new SolanaXConnector(wallet));
    SolanaXService.getInstance().setXConnectors(solanaConnectors);
    useXWagmiStore.getState().setXConnectors('SOLANA', solanaConnectors);
  }, [solanaWallets]);

  // Hydrate connection state into store
  useEffect(() => {
    if (solanaWallet.connected && solanaWallet.publicKey) {
      setXConnection('SOLANA', {
        xAccount: { address: solanaWallet.publicKey.toString(), xChainType: 'SOLANA' },
        xConnectorId: `${solanaWallet.wallet?.adapter.name}`,
      });
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, solanaWallet.wallet, setXConnection]);

  // Register ChainActions
  useEffect(() => {
    const actions: ChainActions = {
      connect: async (xConnectorId: string) => {
        const wallet = solanaWallets.find(w => w.adapter.name === xConnectorId);
        if (!wallet) return undefined;

        solanaWallet.select(wallet.adapter.name);

        // MetaMask Solana needs special timeout handling
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

            solanaWallet.connect().catch(err => {
              cleanup();
              reject(err);
            });
          });
        }

        // Connection state hydrated via useWallet effects above
        return undefined;
      },
      disconnect: async () => {
        await solanaWallet.disconnect();
        unsetXConnection('SOLANA');
      },
      getConnectors: () => SolanaXService.getInstance().getXConnectors(),
      getConnection: (): XConnection | undefined => {
        return useXWagmiStore.getState().xConnections.SOLANA;
      },
      signMessage: async (message: string) => {
        if (!solanaWallet.signMessage) {
          throw new Error('Solana wallet not connected');
        }
        const signature = await solanaWallet.signMessage(new TextEncoder().encode(message));
        return new TextDecoder().decode(signature);
      },
    };
    onRegisterActions(actions);
  }, [solanaWallet, solanaWallets, unsetXConnection, onRegisterActions]);

  return null;
};

export const SolanaProvider = ({ children, config, rpcConfig, onRegisterActions }: SolanaProviderProps) => {
  const autoConnect = config?.autoConnect ?? defaultSolanaConfig.autoConnect;
  const endpoint = rpcConfig?.solana ?? 'https://api.mainnet-beta.solana.com';
  const wallets = useMemo(() => [new UnsafeBurnerWalletAdapter()], []);

  return (
    <SolanaConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect={autoConnect}>
        <SolanaHydrator onRegisterActions={onRegisterActions} />
        {children}
      </SolanaWalletProvider>
    </SolanaConnectionProvider>
  );
};

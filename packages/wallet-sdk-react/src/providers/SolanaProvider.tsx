'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React, { useEffect, useMemo, useRef } from 'react';
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
import { useXWalletStore } from '../useXWalletStore';
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
  const setXConnection = useXWalletStore(state => state.setXConnection);
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);

  // Refs to hold latest hook values
  const walletRef = useRef(solanaWallet);
  const unsetConnectionRef = useRef(unsetXConnection);

  useEffect(() => { walletRef.current = solanaWallet; }, [solanaWallet]);
  useEffect(() => { unsetConnectionRef.current = unsetXConnection; }, [unsetXConnection]);

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
    useXWalletStore.getState().setXConnectors('SOLANA', solanaConnectors);
  }, [solanaWallets]);

  // Hydrate connection state into store (set + unset)
  const wasConnectedRef = useRef(!!useXWalletStore.getState().xConnections.SOLANA);
  useEffect(() => {
    if (solanaWallet.connected && solanaWallet.publicKey) {
      wasConnectedRef.current = true;
      setXConnection('SOLANA', {
        xAccount: { address: solanaWallet.publicKey.toString(), xChainType: 'SOLANA' },
        xConnectorId: `${solanaWallet.wallet?.adapter.name}`,
      });
    } else if (wasConnectedRef.current) {
      wasConnectedRef.current = false;
      unsetConnectionRef.current('SOLANA');
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, solanaWallet.wallet, setXConnection]);

  // Register ChainActions — once on mount, uses refs for latest values
  useEffect(() => {
    const actions: ChainActions = {
      connect: async (xConnectorId: string) => {
        const wallet = walletRef.current.wallets.find(w => w.adapter.name === xConnectorId);
        if (!wallet) return undefined;

        walletRef.current.select(wallet.adapter.name);

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

            walletRef.current.connect().catch(err => {
              cleanup();
              reject(err);
            });
          });
        } else if (!walletRef.current.connected) {
          // Non-MetaMask wallets: select() sets the wallet, connect() triggers the connection
          // Guard: skip if autoConnect already handled it
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

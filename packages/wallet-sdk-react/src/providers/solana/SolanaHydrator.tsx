import { useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { SolanaWalletProvider } from '@sodax/wallet-sdk-core';
import { SolanaXService } from '../../xchains/solana/SolanaXService';
import { SolanaXConnector } from '../../xchains/solana';
import { useXWalletStore } from '../../useXWalletStore';

/**
 * Hydrates Solana state from @solana/wallet-adapter-react hooks into SolanaXService singleton and store.
 */
export const SolanaHydrator = () => {
  const { connection } = useConnection();
  const solanaWallet = useWallet();
  const setXConnection = useXWalletStore(state => state.setXConnection);
  const unsetXConnection = useXWalletStore(state => state.unsetXConnection);
  const setWalletProvider = useXWalletStore(state => state.setWalletProvider);

  useEffect(() => {
    if (connection) {
      SolanaXService.getInstance().connection = connection;
    }
  }, [connection]);

  useEffect(() => {
    if (solanaWallet) {
      SolanaXService.getInstance().wallet = solanaWallet;
    }
  }, [solanaWallet]);

  const solanaWallets = solanaWallet.wallets;
  useEffect(() => {
    const solanaConnectors = solanaWallets
      .filter(wallet => wallet.readyState === 'Installed')
      .map(wallet => new SolanaXConnector(wallet));
    SolanaXService.getInstance().setXConnectors(solanaConnectors);
    useXWalletStore.getState().setXConnectors('SOLANA', solanaConnectors);
  }, [solanaWallets]);

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
      unsetXConnection('SOLANA');
    }
  }, [solanaWallet.connected, solanaWallet.publicKey, solanaWallet.wallet, setXConnection, unsetXConnection]);

  // Ref holds latest solanaWallet object — useWallet() returns a new ref every render,
  // so we use primitive fields as deps and read the latest object from the ref.
  const solanaWalletRef = useRef(solanaWallet);
  useEffect(() => { solanaWalletRef.current = solanaWallet; }, [solanaWallet]);

  useEffect(() => {
    if (solanaWallet.connected && solanaWallet.wallet && connection) {
      setWalletProvider('SOLANA', new SolanaWalletProvider({
        wallet: solanaWalletRef.current,
        endpoint: connection.rpcEndpoint,
      }));
    } else {
      setWalletProvider('SOLANA', undefined);
    }
  }, [solanaWallet.connected, solanaWallet.wallet, connection, setWalletProvider]);

  return null;
};

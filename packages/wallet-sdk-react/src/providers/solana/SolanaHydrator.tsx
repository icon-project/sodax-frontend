import { useEffect, useMemo, useRef } from 'react';
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

  // useWallet() returns a new object ref every render — keep a ref so effects
  // can read the full object without listing it as a dep.
  // Empty deps array means this effect runs after every render to keep the ref fresh.
  const solanaWalletRef = useRef(solanaWallet);
  useEffect(() => {
    solanaWalletRef.current = solanaWallet;
  });

  // Memoize installed connectors. solanaWallet.wallets is an unstable array reference,
  // but we only care about the installed subset and stable adapter identity.
  const solanaConnectors = useMemo(
    () =>
      solanaWallet.wallets
        .filter(wallet => wallet.readyState === 'Installed')
        .map(wallet => new SolanaXConnector(wallet)),
    [solanaWallet.wallets],
  );

  useEffect(() => {
    SolanaXService.getInstance().setXConnectors(solanaConnectors);
    useXWalletStore.getState().setXConnectors('SOLANA', solanaConnectors);
  }, [solanaConnectors]);

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

  // Memoize wallet provider so a new instance is only created when its inputs change.
  const walletProvider = useMemo(() => {
    if (solanaWallet.connected && solanaWallet.wallet && connection) {
      return new SolanaWalletProvider({
        wallet: solanaWalletRef.current,
        endpoint: connection.rpcEndpoint,
      });
    }
    return undefined;
  }, [solanaWallet.connected, solanaWallet.wallet, connection]);

  useEffect(() => {
    SolanaXService.getInstance().wallet = solanaWalletRef.current;
    setWalletProvider('SOLANA', walletProvider);
  }, [walletProvider, setWalletProvider]);

  return null;
};

'use client';

/**
 * @deprecated Hydration logic has been moved to per-chain providers (EvmProvider, SolanaProvider, SuiProvider)
 * and SodaxWalletProvider. This component is kept for backward compatibility but is no longer used internally.
 * It will be removed in a future release.
 */

import { useCurrentAccount, useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import { useEffect } from 'react';
import { EvmXService } from './xchains/evm';
import { SolanaXService } from './xchains/solana/SolanaXService';
import { SuiXService } from './xchains/sui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useConfig } from 'wagmi';
import { StacksXService } from './xchains/stacks/StacksXService';
import { createNetwork } from '@stacks/network';
import type { RpcConfig } from '@sodax/types';

/** @deprecated Use per-chain providers instead. See EvmProvider, SolanaProvider, SuiProvider. */
export const Hydrate = ({ rpcConfig }: { rpcConfig: RpcConfig }) => {
  // sui
  const suiClient = useSuiClient();
  useEffect(() => {
    if (suiClient) {
      SuiXService.getInstance().suiClient = suiClient;
    }
  }, [suiClient]);
  const { currentWallet: suiWallet } = useCurrentWallet();
  useEffect(() => {
    if (suiWallet) {
      SuiXService.getInstance().suiWallet = suiWallet;
    }
  }, [suiWallet]);
  const suiAccount = useCurrentAccount();
  useEffect(() => {
    if (suiAccount) {
      SuiXService.getInstance().suiAccount = suiAccount;
    }
  }, [suiAccount]);

  // solana
  const { connection: solanaConnection } = useConnection();
  const solanaWallet = useWallet();
  useEffect(() => {
    if (solanaConnection) {
      SolanaXService.getInstance().connection = solanaConnection;
    }
  }, [solanaConnection]);
  useEffect(() => {
    if (solanaWallet) {
      SolanaXService.getInstance().wallet = solanaWallet;
    }
  }, [solanaWallet]);

  // evm
  const wagmiConfig = useConfig();
  useEffect(() => {
    if (wagmiConfig) {
      EvmXService.getInstance().wagmiConfig = wagmiConfig;
    }
  }, [wagmiConfig]);

  // stacks
  useEffect(() => {
    StacksXService.getInstance().network = createNetwork({
      network: 'mainnet',
      client: { baseUrl: rpcConfig.stacks ?? 'https://api.mainnet.hiro.so' },
    });
  }, [rpcConfig.stacks]);
  return null;
};

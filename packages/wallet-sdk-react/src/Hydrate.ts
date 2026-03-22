'use client';

import { useCurrentAccount, useCurrentWallet, useSuiClient } from '@mysten/dapp-kit';
import { useEffect } from 'react';
import { EvmXService } from './xchains/evm';
import { SolanaXService } from './xchains/solana/SolanaXService';
import { SuiXService } from './xchains/sui';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useConfig, useReconnect } from 'wagmi';
import { StacksXService } from './xchains/stacks/StacksXService';
import { createNetwork } from '@stacks/network';
import type { RpcConfig } from '@sodax/types';

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
  const { reconnect } = useReconnect();
  useEffect(() => {
    if (wagmiConfig) {
      EvmXService.getInstance().wagmiConfig = wagmiConfig;
    }
  }, [wagmiConfig]);
  useEffect(() => {
    reconnect();
  }, [reconnect]);

  // stacks
  useEffect(() => {
    StacksXService.getInstance().network = createNetwork({
      network: 'mainnet',
      client: { baseUrl: rpcConfig.stacks ?? 'https://api.mainnet.hiro.so' },
    });
  }, [rpcConfig.stacks]);
  return null;
};

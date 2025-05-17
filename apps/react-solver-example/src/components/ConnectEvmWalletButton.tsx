import { Button } from '@/components/ui/button';
import { useSolver } from '@/contexts/SolverContextProvider';
import {
  EvmHubProvider,
  EvmInitializedConfig,
  type EvmSpokeChainConfig,
  type EvmSpokeChainId,
  EvmSpokeProvider,
  type EvmUninitializedBrowserConfig,
  EvmUninitializedPrivateKeyConfig,
  EvmWalletProvider,
  SONIC_MAINNET_CHAIN_ID,
  getEvmViemChain,
  getHubChainConfig,
  getSpokeChainConfigsPerType,
  spokeChainConfig,
} from '@new-world/sdk';
import React from 'react';
import { sonic } from 'viem/chains';
import { http, useConnect } from 'wagmi';
import { createWalletClient, createPublicClient } from 'viem';
import { injected } from 'wagmi/connectors';

export default function ConnectEvmWalletButton() {
  const { setEvmProviders, setHubProvider } = useSolver();
  const { connectAsync } = useConnect();

  const onConnectClick = async () => {
    const { accounts } = await connectAsync({ connector: injected() });
    console.log('Connected accounts', accounts);

    const evmChainSpokeProviders: EvmSpokeProvider[] = [];

    // initi all chain providers
    for (const evmChainConfig of getSpokeChainConfigsPerType('evm')) {
      const chainId: EvmSpokeChainId = evmChainConfig.chain.id;
      const evmWalletProvider: EvmWalletProvider = new EvmWalletProvider({
        userAddress: accounts[0],
        chain: evmChainConfig.chain.id,
        provider: window.hanaWallet.ethereum
      } satisfies EvmUninitializedBrowserConfig);

      // spoke provider represents connection to a specific chain, should be instantiated for each supported chain
      const evmSpokeProvider: EvmSpokeProvider = new EvmSpokeProvider(
        evmWalletProvider,
        spokeChainConfig[chainId] as EvmSpokeChainConfig,
      );

      evmChainSpokeProviders.push(evmSpokeProvider);
    }

    // initialise hub wallet for Sonic interactions
    const hubWalletProvider: EvmWalletProvider = new EvmWalletProvider(
      {
        walletClient: createWalletClient({
          account: accounts[0],
          transport: http("https://rpc.soniclabs.com"),
          chain: getEvmViemChain(sonic.id),
        }),
        publicClient: createPublicClient({
          transport: http("https://rpc.soniclabs.com"),
          chain: getEvmViemChain(sonic.id),
        }),
      }  satisfies EvmInitializedConfig);

    const hubProvider = new EvmHubProvider(hubWalletProvider, getHubChainConfig(SONIC_MAINNET_CHAIN_ID));

    setHubProvider(hubProvider);
    setEvmProviders(evmChainSpokeProviders);
  };

  return <Button onClick={() => onConnectClick()}>Connect Evm Wallet</Button>;
}

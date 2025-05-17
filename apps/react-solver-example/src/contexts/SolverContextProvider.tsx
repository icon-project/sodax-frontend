import {
  type ChainType,
  type EvmHubProvider,
  type EvmSpokeProvider,
  type GetSpokeProviderType,
  type Hex,
  type IconSpokeProvider,
  SolverService,
  type SpokeChainId,
  type SpokeProvider,
  type StellarSpokeProvider,
  type SuiSpokeProvider,
  spokeChainConfig,
} from '@new-world/sdk';
import React, { createContext, type ReactNode, useContext, useState } from 'react';

export interface SolverContextProps {
  hubProvider: EvmHubProvider | undefined;
  solverService: SolverService;
  evmProviders: EvmSpokeProvider[];
  setIconProvider: (value: IconSpokeProvider) => void;
  setEvmProviders: (value: EvmSpokeProvider[]) => void;
  setSuiProvider: (value: SuiSpokeProvider) => void;
  setStellarProvider: (value: StellarSpokeProvider) => void;
  setHubProvider: (value: EvmHubProvider) => void;
  getConnectedWalletAddressBytes: (chainId: SpokeChainId) => Hex;
  getProvider: (value: ChainType, chainId: SpokeChainId) => SpokeProvider | undefined;
}

const SolverContext = createContext<SolverContextProps | undefined>(undefined);

export const SolverContextProvider = ({ children }: { children: ReactNode }) => {
  const [evmProviders, setEvmProviders] = useState<EvmSpokeProvider[]>([]);
  const [suiProvider, setSuiProvider] = useState<SuiSpokeProvider | undefined>(undefined);
  const [iconProvider, setIconProvider] = useState<IconSpokeProvider | undefined>(undefined);
  const [stellarProvider, setStellarProvider] = useState<StellarSpokeProvider | undefined>(undefined);
  const [hubProvider, setHubProvider] = useState<EvmHubProvider | undefined>(undefined);
  const [solverService] = useState<SolverService>(
    new SolverService({
      intentsContract: '0x6382D6ccD780758C5e8A6123c33ee8F4472F96ef', // Sonic Mainnet Hub Intents Contract
      solverApiEndpoint: 'https://staging-new-world.iconblockchain.xyz', // Mainnet staging solver
      relayerApiEndpoint: 'https://xcall-relay.nw.iconblockchain.xyz', // Mainnet relayer
    }),
  );

  function getProvider<T extends ChainType>(chain: T, chainId: SpokeChainId): GetSpokeProviderType<T> | undefined {
    switch (chain) {
      case 'evm': {
        const evmProvider = evmProviders.find(provider => provider.chainConfig.chain.id === chainId);
        if (!evmProvider) return undefined;
        return evmProvider as GetSpokeProviderType<T>;
      }
      case 'sui': {
        if (!suiProvider) return undefined;
        return suiProvider as GetSpokeProviderType<T>;
      }
      case 'icon': {
        if (!iconProvider) return undefined;
        return iconProvider as GetSpokeProviderType<T>;
      }
      case 'stellar': {
        if (!stellarProvider) return undefined;
        return stellarProvider as GetSpokeProviderType<T>;
      }
      default:
        throw new Error(`Unsupported chain: ${chain}`);
    }
  }

  function getConnectedWalletAddressBytes(chainId: SpokeChainId): Hex {
    const provider = getProvider(spokeChainConfig[chainId].chain.type, chainId);
    if (!provider) throw new Error(`Provider for chain ${chainId} not found`);
    return provider.walletProvider.getWalletAddressBytes();
  }

  const values = {
    hubProvider,
    solverService,
    evmProviders,
    setIconProvider,
    setEvmProviders,
    setSuiProvider,
    setStellarProvider,
    setHubProvider,
    getConnectedWalletAddressBytes,
    getProvider,
  };

  return <SolverContext.Provider value={values}>{children}</SolverContext.Provider>;
};

export const useSolver = () => {
  const context = useContext(SolverContext);

  if (context === undefined) {
    throw new Error('useSolver must be used within a SolverContextProvider');
  }

  return context;
};

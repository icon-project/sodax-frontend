'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React, { useMemo } from 'react';

import type { RpcConfig } from '@sodax/types';
import type { State as WagmiState } from 'wagmi';

import type { SodaxWalletConfig } from './types/config';
import { WalletConfigProvider } from './context/WalletConfigContext';
import { ChainActionsProvider } from './context/ChainActionsContext';
import { EvmProvider } from './providers/evm';
import { SolanaProvider } from './providers/solana';
import { SuiProvider } from './providers/sui';
import { useInitChainServices } from './hooks/useInitChainServices';
import { useStacksHydration } from './hooks/useStacksHydration';
import { useChainActionsRegistryState } from './hooks/useChainActionsRegistry';

// ─── Legacy props (deprecated) ───────────────────────────────────────────────

export type WagmiOptions = {
  reconnectOnMount?: boolean;
  ssr?: boolean;
};

export type SodaxWalletProviderOptions = {
  wagmi?: WagmiOptions;
  solana?: {
    autoConnect?: boolean;
  };
  sui?: {
    autoConnect?: boolean;
  };
};

/** @deprecated Use `config` prop instead */
export type SodaxWalletProviderProps = {
  children: React.ReactNode;
  /** @deprecated Use `config` prop instead */
  rpcConfig?: RpcConfig;
  /** @deprecated Use `config` prop instead */
  options?: SodaxWalletProviderOptions;
  /** @deprecated Use `config.chains.EVM.initialState` instead */
  initialState?: WagmiState;
  /** New config API — if provided, legacy props are ignored */
  config?: SodaxWalletConfig;
};

// ─── Legacy → Config conversion ──────────────────────────────────────────────

const resolveLegacyProps = (
  rpcConfig?: RpcConfig,
  options?: SodaxWalletProviderOptions,
  initialState?: WagmiState,
): SodaxWalletConfig => ({
  chains: {
    EVM: {
      reconnectOnMount: options?.wagmi?.reconnectOnMount,
      ssr: options?.wagmi?.ssr,
      initialState,
    },
    SOLANA: { autoConnect: options?.solana?.autoConnect },
    SUI: { autoConnect: options?.sui?.autoConnect },
    BITCOIN: { enabled: true },
    ICON: { enabled: true },
    INJECTIVE: { enabled: true },
    STELLAR: { enabled: true },
    NEAR: { enabled: true },
    STACKS: { enabled: true },
  },
  rpcConfig,
});

// ─── Provider ────────────────────────────────────────────────────────────────

export const SodaxWalletProvider = ({
  children,
  config: configProp,
  rpcConfig: rpcConfigProp,
  options,
  initialState,
}: SodaxWalletProviderProps) => {
  // Stable config — destructure options into primitives to avoid object reference churn
  const wagmiReconnectOnMount = options?.wagmi?.reconnectOnMount;
  const wagmiSsr = options?.wagmi?.ssr;
  const solanaAutoConnect = options?.solana?.autoConnect;
  const suiAutoConnect = options?.sui?.autoConnect;

  const config = useMemo(
    () =>
      configProp ??
      resolveLegacyProps(
        rpcConfigProp,
        { wagmi: { reconnectOnMount: wagmiReconnectOnMount, ssr: wagmiSsr }, solana: { autoConnect: solanaAutoConnect }, sui: { autoConnect: suiAutoConnect } },
        initialState,
      ),
    [configProp, rpcConfigProp, wagmiReconnectOnMount, wagmiSsr, solanaAutoConnect, suiAutoConnect, initialState],
  );

  const { chains, rpcConfig } = config;

  // Initialize chain services + reconnect
  useInitChainServices(chains);

  // Hydrate Stacks network
  useStacksHydration(chains, rpcConfig);

  // ChainActions registry
  const { registry, registerEvmActions, registerSolanaActions, registerSuiActions } = useChainActionsRegistryState();

  // Compose providers conditionally
  let content = <>{children}</>;

  if (chains.SOLANA) {
    content = (
      <SolanaProvider config={chains.SOLANA} rpcConfig={rpcConfig} onRegisterActions={registerSolanaActions}>
        {content}
      </SolanaProvider>
    );
  }

  if (chains.SUI) {
    content = (
      <SuiProvider config={chains.SUI} onRegisterActions={registerSuiActions}>
        {content}
      </SuiProvider>
    );
  }

  if (chains.EVM) {
    content = (
      <EvmProvider config={chains.EVM} rpcConfig={rpcConfig} onRegisterActions={registerEvmActions}>
        {content}
      </EvmProvider>
    );
  }

  return (
    <WalletConfigProvider value={config}>
      <ChainActionsProvider value={registry}>
        {content}
      </ChainActionsProvider>
    </WalletConfigProvider>
  );
};

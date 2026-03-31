'use client';

// biome-ignore lint/style/useImportType: <explanation>
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { RpcConfig } from '@sodax/types';
import type { State as WagmiState } from 'wagmi';

import type { SodaxWalletConfig } from './types/config';
import type { ChainActions, ChainActionsRegistry } from './context/ChainActionsContext';
import { WalletConfigProvider } from './context/WalletConfigContext';
import { ChainActionsProvider } from './context/ChainActionsContext';
import { EvmProvider } from './providers/EvmProvider';
import { SolanaProvider } from './providers/SolanaProvider';
import { SuiProvider } from './providers/SuiProvider';
import { useXWalletStore } from './useXWalletStore';
import { createNetwork } from '@stacks/network';
import { StacksXService } from './xchains/stacks/StacksXService';
import { reconnectIcon } from './xchains/icon/actions';
import { reconnectInjective } from './xchains/injective/actions';
import { reconnectStellar } from './xchains/stellar/actions';

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

const resolveLegacyProps = (props: SodaxWalletProviderProps): SodaxWalletConfig => {
  if (props.config) return props.config;

  return {
    chains: {
      EVM: {
        reconnectOnMount: props.options?.wagmi?.reconnectOnMount,
        ssr: props.options?.wagmi?.ssr,
        initialState: props.initialState,
      },
      SOLANA: {
        autoConnect: props.options?.solana?.autoConnect,
      },
      SUI: {
        autoConnect: props.options?.sui?.autoConnect,
      },
      BITCOIN: { enabled: true },
      ICON: { enabled: true },
      INJECTIVE: { enabled: true },
      STELLAR: { enabled: true },
      NEAR: { enabled: true },
      STACKS: { enabled: true },
    },
    rpcConfig: props.rpcConfig,
  };
};

// ─── Provider ────────────────────────────────────────────────────────────────

export const SodaxWalletProvider = ({ children, config: configProp, rpcConfig: rpcConfigProp, options, initialState }: SodaxWalletProviderProps) => {
  const wagmiReconnectOnMount = options?.wagmi?.reconnectOnMount;
  const wagmiSsr = options?.wagmi?.ssr;
  const solanaAutoConnect = options?.solana?.autoConnect;
  const suiAutoConnect = options?.sui?.autoConnect;

  const config = useMemo(
    () =>
      configProp ??
      resolveLegacyProps({
        children: null as never,
        config: configProp,
        rpcConfig: rpcConfigProp,
        options: { wagmi: { reconnectOnMount: wagmiReconnectOnMount, ssr: wagmiSsr }, solana: { autoConnect: solanaAutoConnect }, sui: { autoConnect: suiAutoConnect } },
        initialState,
      }),
    [configProp, rpcConfigProp, wagmiReconnectOnMount, wagmiSsr, solanaAutoConnect, suiAutoConnect, initialState],
  );
  const { chains, rpcConfig } = config;

  // Init non-provider chains via store
  const initChainServices = useXWalletStore(state => state.initChainServices);
  const initializedRef = useRef(false);
  useEffect(() => {
    if (!initializedRef.current) {
      initChainServices(chains);
      initializedRef.current = true;

      // Reconnect after persist hydration restores xConnections from localStorage
      const runReconnect = () => {
        if (chains.ICON) reconnectIcon();
        if (chains.INJECTIVE) reconnectInjective();
        if (chains.STELLAR) reconnectStellar();
      };

      if (useXWalletStore.persist.hasHydrated()) {
        runReconnect();
      } else {
        useXWalletStore.persist.onFinishHydration(runReconnect);
      }
    }
  }, [chains, initChainServices]);

  // Hydrate Stacks network (was in Hydrate.ts)
  useEffect(() => {
    if (chains.STACKS) {
      StacksXService.getInstance().network = createNetwork({
        network: 'mainnet',
        client: { baseUrl: rpcConfig?.stacks ?? 'https://api.mainnet.hiro.so' },
      });
    }
  }, [chains.STACKS, rpcConfig?.stacks]);

  // ChainActions registry — providers register actions via callback
  const [actionsRegistry, setActionsRegistry] = useState<ChainActionsRegistry>({});

  const registerEvmActions = useCallback((actions: ChainActions) => {
    setActionsRegistry(prev => ({ ...prev, EVM: actions }));
  }, []);

  const registerSolanaActions = useCallback((actions: ChainActions) => {
    setActionsRegistry(prev => ({ ...prev, SOLANA: actions }));
  }, []);

  const registerSuiActions = useCallback((actions: ChainActions) => {
    setActionsRegistry(prev => ({ ...prev, SUI: actions }));
  }, []);

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
      <ChainActionsProvider value={actionsRegistry}>
        {content}
      </ChainActionsProvider>
    </WalletConfigProvider>
  );
};

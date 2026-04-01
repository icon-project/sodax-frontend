'use client';

import { useCallback, useState } from 'react';
import type { ChainActions, ChainActionsRegistry } from '../context/ChainActionsContext';

/**
 * Manages the ChainActions registry. Returns the registry + per-chain register callbacks.
 */
export function useChainActionsRegistryState() {
  const [registry, setRegistry] = useState<ChainActionsRegistry>({});

  const registerEvmActions = useCallback((actions: ChainActions) => {
    setRegistry(prev => ({ ...prev, EVM: actions }));
  }, []);

  const registerSolanaActions = useCallback((actions: ChainActions) => {
    setRegistry(prev => ({ ...prev, SOLANA: actions }));
  }, []);

  const registerSuiActions = useCallback((actions: ChainActions) => {
    setRegistry(prev => ({ ...prev, SUI: actions }));
  }, []);

  return { registry, registerEvmActions, registerSolanaActions, registerSuiActions };
}

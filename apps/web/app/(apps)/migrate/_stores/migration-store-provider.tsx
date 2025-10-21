// src/providers/counter-store-provider.tsx
'use client';

import { type ReactNode, createContext, useRef, useContext, useMemo } from 'react';
import { useStore } from 'zustand';

import {
  type MigrationStore,
  createMigrationStore,
  // initMigrationStore,
} from './migration-store';
import { parseUnits } from 'viem';
import { getXChainType, useXAccount, useXBalances } from '@sodax/wallet-sdk-react';

export type MigrationStoreApi = ReturnType<typeof createMigrationStore>;

export const MigrationStoreContext = createContext<MigrationStoreApi | undefined>(undefined);

export interface MigrationStoreProviderProps {
  children: ReactNode;
}

export const MigrationStoreProvider = ({ children }: MigrationStoreProviderProps) => {
  const storeRef = useRef<MigrationStoreApi | null>(null);
  if (storeRef.current === null) {
    // storeRef.current = createMigrationStore(initMigrationStore())
    storeRef.current = createMigrationStore();
  }

  return <MigrationStoreContext.Provider value={storeRef.current}>{children}</MigrationStoreContext.Provider>;
};

export const useMigrationStore = <T,>(selector: (store: MigrationStore) => T): T => {
  const counterStoreContext = useContext(MigrationStoreContext);

  if (!counterStoreContext) {
    throw new Error('useMigrationStore must be used within MigrationStoreProvider');
  }

  return useStore(counterStoreContext, selector);
};

export const useMigrationInfo = () => {
  const migrationMode = useMigrationStore(state => state.migrationMode);
  const direction = useMigrationStore(state => state[migrationMode].direction);
  const currencies = useMigrationStore(state => state[migrationMode].currencies);
  const typedValue = useMigrationStore(state => state[migrationMode].typedValue);
  const { address: sourceAddress } = useXAccount(getXChainType(direction.from));
  const { data: balances } = useXBalances({
    xChainId: direction.from,
    xTokens: [currencies.from],
    address: sourceAddress,
  });

  const sourceBalance = balances?.[currencies.from.address] || 0n;
  const inputError = useMemo(() => {
    if (typedValue === '' || Number(typedValue) <= 0) {
      return 'Enter amount';
    }
    if (sourceBalance < parseUnits(typedValue, currencies.from.decimals)) {
      return 'Insufficient balance';
    }
    return '';
  }, [typedValue, currencies.from.decimals, sourceBalance]);
  return {
    migrationMode,
    direction,
    currencies,
    typedValue,
    inputError,
  };
};

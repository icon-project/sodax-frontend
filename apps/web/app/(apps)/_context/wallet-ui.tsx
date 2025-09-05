'use client';

import type React from 'react';
import { createContext, useContext } from 'react';
import type { ChainType } from '@sodax/types';

type WalletUIContextValue = {
  openWalletModal: (targetChainType?: ChainType) => void;
};

const WalletUIContext = createContext<WalletUIContextValue | null>(null);

export function WalletUIProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: WalletUIContextValue;
}) {
  return <WalletUIContext.Provider value={value}>{children}</WalletUIContext.Provider>;
}

export function useWalletUI() {
  const ctx = useContext(WalletUIContext);
  if (!ctx) throw new Error('useWalletUI must be used within WalletUIProvider');
  return ctx;
}

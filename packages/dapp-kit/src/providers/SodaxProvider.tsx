import type { ReactNode, ReactElement } from 'react';
import { Sodax, type SodaxConfig } from '@sodax/sdk';
import { SodaxContext } from '@/contexts';
import React from 'react';

interface SodaxProviderProps {
  children: ReactNode;
  testnet?: boolean;
  config: SodaxConfig;
}

export const SodaxProvider = ({ children, testnet = false, config }: SodaxProviderProps): ReactElement => {
  const sodax = new Sodax(config);

  return <SodaxContext.Provider value={{ sodax, testnet }}>{children}</SodaxContext.Provider>;
};

import type { XChainId } from '@new-world/xwagmi';
import { type ReactNode, createContext, useContext, useState } from 'react';

interface ChainSelectorContextType {
  selectedChain: XChainId;
  changeChain: (chain: XChainId) => void;
}

const ChainSelectorContext = createContext<ChainSelectorContextType | undefined>(undefined);

export function ChainSelectorProvider({
  children,
  defaultChain = '0xa869.fuji',
}: { children: ReactNode; defaultChain?: XChainId }) {
  const [selectedChain, setSelectedChain] = useState<XChainId>(defaultChain);

  const changeChain = (chain: XChainId) => {
    setSelectedChain(chain);
  };

  return (
    <ChainSelectorContext.Provider
      value={{
        selectedChain,
        changeChain,
      }}
    >
      {children}
    </ChainSelectorContext.Provider>
  );
}

export function useChainSelector() {
  const context = useContext(ChainSelectorContext);
  if (context === undefined) {
    throw new Error('useChainSelector must be used within a ChainSelectorProvider');
  }
  return context;
}

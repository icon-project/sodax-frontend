import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { xChains } from '@sodax/wallet-sdk';
import { useSodaxContext } from '@sodax/dapp-kit';
import { useAppStore } from '@/zustand/useAppStore';

export function ChainSelector() {
  const { selectedChain, changeChain } = useAppStore();
  const { testnet } = useSodaxContext();

  return (
    <Select value={selectedChain} onValueChange={changeChain}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          <SelectValue placeholder="Select a chain" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {xChains
          .filter(x => testnet === x.testnet)
          .map(xChain => (
            <SelectItem key={xChain.xChainId} value={xChain.xChainId}>
              {xChain.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

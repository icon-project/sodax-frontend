import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { baseChainInfo, type ChainId } from '@sodax/types';

interface ChainSelectorProps {
  selectedChainId: ChainId;
  selectChainId: (chainId: ChainId) => void;
  allowedChains?: ChainId[]; // optional — only restrict when provided
}
export function ChainSelector({ selectedChainId, selectChainId, allowedChains }: ChainSelectorProps) {
  const chains = Object.values(baseChainInfo)
    .filter(chain => !allowedChains || allowedChains.includes(chain.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return (
    <Select value={selectedChainId} onValueChange={selectChainId}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          <SelectValue placeholder="Select a chain" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {chains.map(xChain => (
          <SelectItem key={xChain.id} value={xChain.id}>
            <div className="flex items-center gap-2">{xChain.name}</div>{' '}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

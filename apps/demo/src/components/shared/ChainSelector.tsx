import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { baseChainInfo, type SpokeChainKey } from '@sodax/types';

interface ChainSelectorProps {
  selectedChainId: SpokeChainKey;
  selectChainId: (chainId: SpokeChainKey) => void;
  allowedChains?: SpokeChainKey[];
}
export function ChainSelector({ selectedChainId, selectChainId, allowedChains }: ChainSelectorProps) {
  const chains = Object.values(baseChainInfo)
    .filter(chain => !allowedChains || allowedChains.includes(chain.key))
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
          <SelectItem key={xChain.key} value={xChain.key}>
            <div className="flex items-center gap-2">{xChain.name}</div>{' '}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

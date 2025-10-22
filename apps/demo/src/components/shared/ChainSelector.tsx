import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { baseChainInfo, type ChainId } from '@sodax/types';

export function ChainSelector({
  selectedChainId,
  selectChainId,
}: {
  selectedChainId: ChainId;
  selectChainId: (chainId: ChainId) => void;
}) {
  return (
    <Select value={selectedChainId} onValueChange={selectChainId}>
      <SelectTrigger className="w-[200px]">
        <div className="flex items-center gap-2">
          <SelectValue placeholder="Select a chain" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {Object.values(baseChainInfo).map(xChain => (
          <SelectItem key={xChain.id} value={xChain.id}>
            {xChain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

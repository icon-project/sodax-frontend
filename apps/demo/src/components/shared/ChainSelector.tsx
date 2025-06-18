import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { xChains } from '@sodax/wallet-sdk';
import type { ChainId } from '@sodax/types';

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
        {xChains.map(xChain => (
          <SelectItem key={xChain.xChainId} value={xChain.xChainId}>
            {xChain.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

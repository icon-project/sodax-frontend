import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { xChains } from '@sodax/wallet-sdk';
import { useSodaxContext } from '@sodax/dapp-kit';
import type { ChainId } from '@sodax/types';

export function ChainSelector({
  selectedChainId,
  selectChainId,
}: {
  selectedChainId: ChainId;
  selectChainId: (chainId: ChainId) => void;
}) {
  const { testnet } = useSodaxContext();

  return (
    <Select value={selectedChainId} onValueChange={selectChainId}>
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

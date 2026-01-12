'use client';

import type * as React from 'react';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import NetworkIcon from '@/components/shared/network-icon';
import { chainIdToChainName } from '@/providers/constants';
import { formatBalance } from '@/lib/utils';
import type { SpokeChainId } from '@sodax/types';
import type { NetworkBalance } from '../../page';

interface NetworkBalanceTooltipProps {
  network: NetworkBalance;
  tokenPrice: number;
  count: number;
}

/**
 * Displays a network icon with a tooltip showing the balance on that network.
 * Tooltip is hidden when there's only one network (count === 1).
 */
export function NetworkBalanceTooltip({ network, tokenPrice, count }: NetworkBalanceTooltipProps): React.JSX.Element {
  // Format balance for display in tooltip
  const formattedBalance = useMemo((): string => {
    const balance = formatBalance(network.balance, tokenPrice);
    return `${balance} ${network.token.symbol}`;
  }, [network.balance, network.token.symbol, tokenPrice]);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <NetworkIcon id={network.networkId} className="w-4 h-4 scale-65" />
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        sideOffset={10}
        hidden={count === 1}
        className="bg-white px-8 py-4 items-center gap-2 text-espresso rounded-full h-[54px] text-(length:--body-comfortable)"
      >
        <div className="flex gap-1">
          <div className="font-medium">{formattedBalance}</div>
          <div className="">on {chainIdToChainName(network.networkId as SpokeChainId)}</div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

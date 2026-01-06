import type React from 'react';
import type { NetworkBalance } from '../../page';
import { formatBalance } from '@/lib/utils';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeChainId, XToken } from '@sodax/types';
import CanLogo from '@/components/shared/can-logo';
import { cn } from '@/lib/utils';

interface WithdrawTokenSelectProps {
  networksWithFunds: NetworkBalance[];
  selectedNetwork: NetworkBalance | null;
  onSelectNetwork: (network: NetworkBalance) => void;
}

export default function WithdrawTokenSelect({
  networksWithFunds,
  selectedNetwork,
  onSelectNetwork,
}: WithdrawTokenSelectProps): React.JSX.Element {
  const { data: tokenPrice } = useTokenPrice(networksWithFunds[0]?.token as XToken);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
        Withdraw from a {networksWithFunds[0]?.token.symbol} deposit
      </div>

      <div className="grid grid-cols-2 gap-4">
        {networksWithFunds.map(network => {
          const isSelected = selectedNetwork?.networkId === network.networkId;
          const formattedBalance = formatBalance(network.balance, tokenPrice ?? 0);

          return (
            <div
              key={network.networkId}
              onClick={() => onSelectNetwork(network)}
              className={cn(
                'flex items-center gap-3 transition-all duration-200 cursor-pointer',
                'hover:opacity-100',
                selectedNetwork === null ? 'opacity-100' : isSelected ? 'opacity-100' : 'blur-sm',
              )}
            >
              <div className="flex items-center gap-2 flex-1">
                <CanLogo currency={network.token as XToken} className="w-14 h-14" />
                <div className="flex flex-col items-start flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-espresso text-(length:--body-comfortable) font-bold font-['InterRegular']">
                      {formattedBalance} {network.token.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-clay-light text-(length:--body-small) font-medium font-['InterRegular']">
                      {chainIdToChainName(network.networkId as SpokeChainId)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import type React from 'react';
import type { NetworkBalance } from '../../page';
import { formatBalance } from '@/lib/utils';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { chainIdToChainName } from '@/providers/constants';
import type { SpokeChainId, XToken } from '@sodax/types';
import CanLogo from '@/components/shared/can-logo';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useState } from 'react';

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
  const [hoveredNetwork, setHoveredNetwork] = useState<number | null>(null);
  console.log(hoveredNetwork);
  return (
    <div className="flex flex-col gap-4">
      <div className="text-espresso text-(length:--body-super-comfortable) font-bold font-['InterRegular'] leading-[1.4]">
        Withdraw from a {networksWithFunds[0]?.token.symbol} deposit
      </div>

      <div className="grid grid-cols-2 gap-4">
        {networksWithFunds.map((network, index) => {
          const isSelected = selectedNetwork?.networkId === network.networkId;
          const formattedBalance = formatBalance(network.balance, tokenPrice ?? 0);

          return (
            <motion.div
              key={network.networkId}
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => onSelectNetwork(network)}
              onMouseEnter={() => setHoveredNetwork(index)}
              onMouseLeave={() => setHoveredNetwork(null)}
              className={cn(
                'flex items-center gap-3 cursor-pointer',
                selectedNetwork !== null
                  ? isSelected
                    ? 'opacity-100'
                    : 'blur-sm'
                  : hoveredNetwork !== null
                    ? hoveredNetwork === index
                      ? 'opacity-100'
                      : 'opacity-80'
                    : 'opacity-100',
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
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

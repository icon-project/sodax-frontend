'use client';

import type * as React from 'react';
import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CarouselItem } from '@/components/ui/carousel';
import { formatBalance } from '@/lib/utils';
import { CircleMinusIcon, CirclePlusIcon, Settings2 } from 'lucide-react';
import CanLogo from '@/components/shared/can-logo';
import { Item, ItemContent, ItemMedia, ItemDescription } from '@/components/ui/item';
import type { SpokeChainId } from '@sodax/types';
import { Badge } from '@/components/ui/badge';
import { chainIdToChainName } from '@/providers/constants';
import type { DepositItemData } from '../../page';
import { motion } from 'motion/react';
import { useSaveActions } from '../../_stores/save-store-provider';
import { NetworkBalanceTooltip } from './network-balance-tooltip';

interface DepositItemContentProps {
  item: DepositItemData;
  tokenPrices?: Record<string, number>;
  onWithdrawClick: () => void;
}

/**
 * Renders a single carousel item card with token information, balance, and action buttons.
 * Includes hover animations and network balance tooltips.
 */
export function DepositItemContent({ item, tokenPrices, onWithdrawClick }: DepositItemContentProps): React.JSX.Element {
  const [isHovered, setIsHovered] = useState(false);
  const priceKey = `${item.asset.symbol}-${item.asset.xChainId}`;
  const tokenPrice = tokenPrices?.[priceKey] || 0;
  const { setActiveAsset, setScrollToCenter } = useSaveActions();
  const formattedBalance = useMemo((): string => {
    return `${formatBalance(item.totalBalance, tokenPrice)} ${item.asset.symbol}`;
  }, [item.totalBalance, item.asset.symbol, tokenPrice]);

  return (
    <CarouselItem className="basis-1/1.5">
      <Card
        className="group bg-almost-white w-80 h-42 px-6 py-8 border-none !shadow-none select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="flex flex-col p-0 border-none">
          <motion.div
            animate={{ opacity: 0 }}
            className="flex justify-end w-full"
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <Settings2 className="w-4 h-4 text-clay-light cursor-pointer" />
          </motion.div>
          <motion.div
            className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full"
            data-name="Container"
            animate={{ y: isHovered ? -20 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Item className="p-0 w-full gap-2">
              <ItemMedia className="w-14 h-14">
                <CanLogo currency={item.asset} hideNetworkIcon={true} />
              </ItemMedia>
              <ItemContent className="gap-0">
                <motion.p
                  className="font-['InterBold'] font-bold relative shrink-0 text-[16px] w-full"
                  animate={{ color: isHovered ? 'var(--clay)' : 'var(--espresso)' }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {formattedBalance}
                </motion.p>
                <motion.p
                  className="font-['InterRegular'] font-medium relative shrink-0 text-[14px] w-full"
                  animate={{ color: isHovered ? 'var(--clay-light)' : 'var(--clay)' }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {item.fiatValue}
                </motion.p>
                <ItemDescription className="flex justify-between flex-row w-full">
                  <div className="flex gap-[2px] items-center -ml-[2px] flex-wrap">
                    {item.networksWithFunds.map((network, idx) => (
                      <NetworkBalanceTooltip
                        key={`${network.networkId}-${idx}`}
                        network={network}
                        tokenPrice={tokenPrice}
                        count={item.networksWithFunds.length}
                      />
                    ))}
                    {item.networksWithFunds.length === 1 && (
                      <span className="text-clay text-(length:--body-small) font-medium font-['InterRegular']">
                        On {chainIdToChainName(item.networksWithFunds[0]?.networkId as SpokeChainId)}
                      </span>
                    )}
                  </div>
                  <motion.div
                    className="content-stretch flex gap-[4px] h-[16px] items-center justify-center mix-blend-multiply px-[8px] py-0 relative rounded-[256px] shrink-0"
                    data-name="Badge"
                    animate={{ opacity: isHovered ? 0 : 1 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <Badge className="h-4 min-w-[70px] mix-blend-multiply text-white bg-gradient-to-br from-cherry-bright to-cherry-brighter px-2">
                      <span className="text-[10px] font-['InterBold'] mt-[1px]">{item.apy} APY</span>
                    </Badge>
                  </motion.div>
                </ItemDescription>
              </ItemContent>
            </Item>
          </motion.div>
          <motion.div
            className="content-stretch flex gap-[16px] items-center relative shrink-0 has-[:hover]:[&>*:not(:hover)]:opacity-40 pl-15"
            data-name="Actions"
            initial={{ y: 40, opacity: 0 }}
            animate={{
              y: isHovered ? 0 : 40,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div
              className="gap-1 text-(length:--body-small) text-clay font-medium flex cursor-pointer transition-all duration-200 hover:!opacity-100 hover:!text-espresso"
              onClick={() => {
                setActiveAsset(item.asset.symbol);
                setScrollToCenter(true);
                setTimeout(() => {
                  setScrollToCenter(false);
                }, 1000);
              }}
            >
              <CirclePlusIcon className="w-4 h-4 text-espresso transition-opacity duration-200" />
              Add
            </div>
            <div
              className="gap-1 text-(length:--body-small) text-clay font-medium flex cursor-pointer transition-all duration-200 hover:!opacity-100 hover:!text-espresso"
              onClick={onWithdrawClick}
            >
              <CircleMinusIcon className="w-4 h-4 text-espresso transition-opacity duration-200" />
              Withdraw
            </div>
            {/* <div className="gap-1 text-(length:--body-small) text-clay font-medium flex cursor-pointer transition-all duration-200 hover:!opacity-100 hover:!text-espresso">
              <HistoryIcon className="w-4 h-4 text-espresso transition-opacity duration-200" />
              History
            </div> */}
          </motion.div>
        </CardContent>
      </Card>
    </CarouselItem>
  );
}

import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { accordionVariants } from '@/constants/animation';
import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse, UserReserveData } from '@sodax/sdk';
import { useLiquidity } from '@/hooks/useAPY';
import { formatUnits } from 'viem';
import { useWalletProvider, useXAccount } from '@sodax/wallet-sdk-react';
import { useSpokeProvider, useUserReservesData } from '@sodax/dapp-kit';
import { useReserveMetrics } from '@/hooks/useReserveMetrics';
import { TokenAsset } from '@/components/shared/token-asset';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import AccordionInfoBlock from './accordion-info-block';
import { CustomSlider } from '@/components/ui/customer-slider';
import NetworkIcon from '@/components/shared/network-icon';

function calculateMetricsForToken(token: XToken, formattedReserves: FormatReserveUSDResponse[]) {
  const { address } = useXAccount(token.xChainId);
  const walletProvider = useWalletProvider(token.xChainId);
  const spokeProvider = useSpokeProvider(token.xChainId, walletProvider);

  const { data: userReserves } = useUserReservesData(spokeProvider, address);

  const metrics = useReserveMetrics({
    token,
    formattedReserves: formattedReserves || [],
    userReserves: userReserves?.[0] as UserReserveData[],
  });

  const supplyBalance = metrics.userReserve
    ? Number(formatUnits(metrics.userReserve.scaledATokenBalance, 18)).toFixed(4)
    : '0';

  return { supplyBalance };
}

export default function AccordionExpandedContent({
  tokens,
  formattedReserves,
  isFormattedReservesLoading,
}: {
  tokens: XToken[];
  formattedReserves?: FormatReserveUSDResponse[];
  isFormattedReservesLoading: boolean;
}) {
  const { apy, deposits } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [isAnyNonActiveHovered, setIsAnyNonActiveHovered] = useState(false);
  const [isShowDeposits, setIsShowDeposits] = useState(false);
  const tokenAssetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState([30]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;

      const networkIcons = document.querySelectorAll('.data-network-icon');
      const isClickInsideAsset = tokenAssetRef.current?.contains(target as Node);

      if (networkIcons.length > 0) {
        if (!isClickInsideAsset) setSelectedAsset(null);
      } else {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setSelectedAsset(null);
        }
      }
    };

    if (selectedAsset !== null) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedAsset]);

  const enrichedTokens = tokens.map(t => ({
    ...t,
    supplyBalance: calculateMetricsForToken(t, formattedReserves || []).supplyBalance,
  }));

  const holdTokens = enrichedTokens
    .filter(t => Number(t.supplyBalance) > 0)
    .sort((a, b) => Number(b.supplyBalance) - Number(a.supplyBalance));

  const platformTokens = enrichedTokens
    .filter(t => Number(t.supplyBalance) === 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  type DisplayItem = {
    token: XToken;
    isHold: boolean;
    isGroup?: boolean;
    tokenCount?: number;
    tokens?: XToken[];
    supplyBalance: string;
  };

  const displayItems: DisplayItem[] = [
    ...holdTokens.map(t => ({ token: t, isHold: true, supplyBalance: t.supplyBalance })),
  ];

  if (platformTokens.length > 0) {
    if (platformTokens.length > 1)
      displayItems.push({
        token: platformTokens[0] || ({} as XToken),
        isHold: false,
        isGroup: true,
        tokenCount: platformTokens.length,
        tokens: platformTokens,
        supplyBalance: platformTokens[0]?.supplyBalance || '0',
      });
    else
      displayItems.push({
        token: platformTokens[0] || ({} as XToken),
        isHold: false,
        supplyBalance: platformTokens[0]?.supplyBalance || '0',
      });
  }

  const handleAssetClick = (index: number) => {
    setSelectedAsset(prev => (prev === index ? null : index));
  };

  const handleAssetMouseEnter = (index: number) => {
    if (selectedAsset !== null && selectedAsset !== index) {
      setIsAnyNonActiveHovered(true);
    }
  };

  const handleAssetMouseLeave = (index: number) => {
    if (selectedAsset !== null && selectedAsset !== index) {
      setIsAnyNonActiveHovered(false);
    }
  };

  return (
    <motion.div
      variants={accordionVariants}
      initial="closed"
      animate="open"
      exit="closed"
      className="pl-0 md:pl-18 flex flex-col gap-4"
    >
      {isShowDeposits ? (
        <div className="p-1">
          <div className="flex gap-2 items-center">
            <NetworkIcon id={tokens[0]?.xChainId || ''} className="scale-150" />
            <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-espresso ml-1">
              $10,000.00
            </div>
            <div className="font-['InterRegular'] text-(length:--body-super-comfortable) text-clay">worth of WBTC</div>
          </div>
          <div className="flex items-center">
            <CustomSlider
              defaultValue={[0]}
              max={30}
              step={1}
              value={progress}
              onValueChange={setProgress}
              className="mt-8"
              trackClassName="bg-cream-white"
              rangeClassName="bg-[linear-gradient(135deg,#EDE6E6_25%,#E3BEBB_25%,#E3BEBB_50%,#EDE6E6_50%,#EDE6E6_75%,#E3BEBB_75%,#E3BEBB_100%)] 
         [background-size:20px_20px]"
              thumbClassName="cursor-pointer bg-white !border-white border-gray-400 w-6 h-6 [filter:drop-shadow(0_2px_24px_#EDE6E6)]"
            ></CustomSlider>
            {/* <span className="w-40 h-10">{progress[0]}%</span> */}
          </div>
          <div className="flex gap-2 items-center mt-6">
            <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay-light">
              Sample available:
            </div>
            <div className="font-['InterRegular'] text-(length:--body-comfortable) font-medium text-clay">0 WBTC</div>
          </div>
        </div>
      ) : (
        <>
          <AccordionInfoBlock apy={apy} deposits={deposits} />
          <div className="flex flex-wrap mt-4 -ml-3" ref={containerRef}>
            {displayItems.map((item, idx) => {
              const isSelected = selectedAsset === idx;
              const shouldBlur = selectedAsset !== null && !isSelected;
              const blurAmount = shouldBlur ? (isAnyNonActiveHovered ? 1 : 4) : 0;

              const wrapperClass = cn(shouldBlur && 'opacity-40');

              return (
                <motion.div
                  key={`${item.token.xChainId || 'group'}-${idx}`}
                  ref={item.isGroup ? tokenAssetRef : undefined}
                  className={wrapperClass}
                  onMouseEnter={() => handleAssetMouseEnter(idx)}
                  onMouseLeave={() => handleAssetMouseLeave(idx)}
                  style={{ filter: `blur(${blurAmount}px)` }}
                  animate={{
                    opacity: shouldBlur ? 0.4 : 1,
                  }}
                  transition={{ duration: 0.18, ease: 'easeInOut' }}
                >
                  <TokenAsset
                    key={item.token?.xChainId}
                    name={item.token?.symbol || ''}
                    token={item.token}
                    isHoldToken={item.isHold}
                    formattedBalance={item.supplyBalance}
                    isGroup={item.isGroup}
                    tokenCount={item.tokenCount}
                    tokens={item.tokens}
                    isClickBlurred={false}
                    isHoverDimmed={false}
                    isHovered={false}
                    onMouseEnter={() => {}}
                    onMouseLeave={() => {}}
                    onClick={() => {
                      handleAssetClick(idx);
                    }}
                    onChainClick={() => {}}
                    isClicked={isSelected}
                  />
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      <div
        className={cn(
          'flex gap-4 items-center mb-8',
          displayItems[selectedAsset as number]?.isGroup && 'blur filter opacity-30',
        )}
      >
        {selectedAsset !== null && !displayItems[selectedAsset as number]?.isGroup && (
          <Button
            variant="cherry"
            className="w-27 mix-blend-multiply shadow-none"
            onMouseDown={() => setIsShowDeposits(true)}
          >
            Simulate
          </Button>
        )}
        {selectedAsset === null || displayItems[selectedAsset as number]?.isGroup ? (
          <Button variant="cream" className="w-27 mix-blend-multiply shadow-none">
            Continue
          </Button>
        ) : null}
        <span className="text-clay text-(length:--body-small) font-['InterRegular']">Select a source</span>
      </div>
    </motion.div>
  );
}

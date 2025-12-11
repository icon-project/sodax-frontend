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
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import AccordionInfoBlock from './accordion-info-block';
import AccordionDeposit from './accordion-deposit';
import { ArrowLeft } from 'lucide-react';
import { TokenAssetWrapper } from './token-asset-wrapper';

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
  const [selectedToken, setSelectedToken] = useState<XToken | null>(null);
  const [progress, setProgress] = useState([30]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;

      const networkIcons = document.querySelectorAll('.data-network-icon');
      const isClickInsideAsset = tokenAssetRef.current?.contains(target as Node);

      if (networkIcons.length > 0) {
        if (!isClickInsideAsset) {
          setSelectedAsset(null);
          setSelectedToken(null);
        }
      } else {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setSelectedAsset(null);
          setSelectedToken(null);
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
        <AccordionDeposit selectedToken={selectedToken} progress={progress} setProgress={setProgress} tokens={tokens} />
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
                  <TokenAssetWrapper
                    item={item}
                    idx={idx}
                    isSelected={isSelected}
                    selectedToken={selectedToken}
                    selectedAsset={selectedAsset}
                    isAnyNonActiveHovered={isAnyNonActiveHovered}
                    handleAssetClick={handleAssetClick}
                    setSelectedToken={setSelectedToken}
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
          !selectedToken && displayItems[selectedAsset as number]?.isGroup && 'blur filter opacity-30',
        )}
      >
        {((selectedAsset !== null && !displayItems[selectedAsset as number]?.isGroup) || selectedToken) && (
          <div className="flex gap-(--layout-space-small)">
            {isShowDeposits && (
              <Button variant="cream" className="w-10 h-10" onMouseDown={() => setIsShowDeposits(false)}>
                <ArrowLeft />
              </Button>
            )}
            <Button
              variant="cherry"
              className="w-27 mix-blend-multiply shadow-none"
              onMouseDown={() => setIsShowDeposits(true)}
            >
              Simulate
            </Button>
          </div>
        )}
        {!selectedToken && (
          <Button variant="cream" className="w-27 mix-blend-multiply shadow-none">
            Continue
          </Button>
        )}
        <span className="text-clay text-(length:--body-small) font-['InterRegular']">Select a source</span>
      </div>
    </motion.div>
  );
}

import { motion } from 'motion/react';
import { accordionVariants } from '@/constants/animation';
import type { XToken } from '@sodax/types';
import type { FormatReserveUSDResponse } from '@sodax/sdk';
import { useLiquidity } from '@/hooks/useAPY';
import { useTokenSupplyBalances } from '@/hooks/useTokenSupplyBalances';
import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import AccordionInfoBlock from './accordion-info-block';
import AccordionDeposit from './accordion-deposit';
import { TokenAssetWrapper } from './token-asset-wrapper';
import { useXAccount } from '@sodax/wallet-sdk-react';
import AccordionDepositButton from './accordion-deposit-button';

export type DisplayItem = {
  token: XToken;
  isHold: boolean;
  isGroup?: boolean;
  tokenCount?: number;
  tokens?: XToken[];
  supplyBalance: string;
};

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
  const [hoveredAsset, setHoveredAsset] = useState<number | null>(null);
  const [isAnyNonActiveHovered, setIsAnyNonActiveHovered] = useState(false);
  const [isShowDeposits, setIsShowDeposits] = useState(false);
  const tokenAssetRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedToken, setSelectedToken] = useState<XToken | null>(null);
  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);

  useEffect(() => {
    if (tokens.length === 1) setSelectedToken(tokens[0] as XToken);
  }, [tokens]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;

      const networkIcons = document.querySelectorAll('.data-network-icon');
      const isClickInsideAsset = tokenAssetRef.current?.contains(target as Node);

      if (networkIcons.length > 0) {
        if (!isClickInsideAsset) {
          setSelectedAsset(null);
          setSelectedToken(null);
          setHoveredAsset(null);
        }
      } else {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setSelectedAsset(null);
          setSelectedToken(null);
          setHoveredAsset(null);
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

  const enrichedTokens = useTokenSupplyBalances(tokens, formattedReserves || []);

  const holdTokens = enrichedTokens
    .filter(t => Number(t.supplyBalance) > 0)
    .sort((a, b) => Number(b.supplyBalance) - Number(a.supplyBalance));

  const platformTokens = enrichedTokens
    .filter(t => Number(t.supplyBalance) === 0)
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

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
    setHoveredAsset(null);
  };

  const handleAssetMouseEnter = (index: number) => {
    if (selectedAsset === null) {
      setHoveredAsset(index);
    } else if (selectedAsset !== index) {
      setIsAnyNonActiveHovered(true);
    }
  };

  const handleAssetMouseLeave = (index: number) => {
    if (selectedAsset === null) {
      setHoveredAsset(null);
    } else if (selectedAsset !== index) {
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
        <AccordionDeposit selectedToken={selectedToken} tokens={tokens} />
      ) : (
        <>
          <AccordionInfoBlock apy={apy} deposits={deposits} />
          <div className="flex flex-wrap -ml-3 -my-[1px]" ref={containerRef}>
            {displayItems.map((item, idx) => {
              const isSelected = selectedAsset === idx;
              const isHovered = selectedAsset === null && hoveredAsset === idx;
              const shouldBlur = selectedAsset !== null && !isSelected;
              const blurAmount = shouldBlur ? (isAnyNonActiveHovered ? 1 : 4) : 0;
              const shouldDim = selectedAsset === null && hoveredAsset !== null && hoveredAsset !== idx;

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
                    isHovered={isHovered}
                    isHoverDimmed={shouldDim}
                    handleAssetClick={handleAssetClick}
                    setSelectedToken={setSelectedToken}
                  />
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      <AccordionDepositButton
        selectedToken={selectedToken}
        selectedAsset={selectedAsset}
        displayItems={displayItems}
        isShowDeposits={isShowDeposits}
        setIsShowDeposits={setIsShowDeposits}
        sourceAddress={sourceAddress}
      />
    </motion.div>
  );
}

// apps/web/app/(apps)/save/_components/asset-list/asset-list-item-content.tsx
import { motion } from 'motion/react';
import { accordionVariants } from '@/constants/animation';
import type { XToken } from '@sodax/types';
import { useReservesUsdFormat } from '@sodax/dapp-kit';
import { useLiquidity } from '@/hooks/useAPY';
import { useTokenWalletBalances } from '@/hooks/useTokenWalletBalances';
import { useState, useRef, useEffect } from 'react';
import DepositInputAmount from './deposit-input-amount';
import { DepositTokenSelect } from './deposit-token-select';

export type DisplayItem = {
  token: XToken;
  isHold: boolean;
  isGroup?: boolean;
  tokenCount?: number;
  tokens?: XToken[];
  supplyBalance: string;
};

export default function AssetListItemContent({
  tokens,
}: {
  tokens: XToken[];
}) {
  const { data: formattedReserves, isLoading: isFormattedReservesLoading } = useReservesUsdFormat();
  const { apy, deposits } = useLiquidity(tokens, formattedReserves, isFormattedReservesLoading);
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<number | null>(null);
  const [isAnyNonActiveHovered, setIsAnyNonActiveHovered] = useState(false);
  const [isShowDeposits, setIsShowDeposits] = useState(false);
  const tokenAssetRef = useRef<HTMLDivElement>(null);
  const [selectedToken, setSelectedToken] = useState<XToken | null>(null);
  const [outsideClick, setOutsideClick] = useState(false);
  useEffect(() => {
    if (tokens.length === 1) setSelectedToken(tokens[0] as XToken);
  }, [tokens]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      const isContinueButton = target.closest('button')?.textContent?.includes('Continue');
      if (!tokenAssetRef.current?.contains(target)) {
        setSelectedAsset(null);
        if (!isContinueButton) {
          setSelectedToken(null);
        }
        setHoveredAsset(null);
        setOutsideClick(true);
        setTimeout(() => {
          setOutsideClick(false);
        }, 100);
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

  const tokensWithBalances = useTokenWalletBalances(tokens);

  const holdTokens = tokensWithBalances
    .filter(t => Number(t.supplyBalance) > 0)
    .sort((a, b) => Number(b.supplyBalance) - Number(a.supplyBalance));

  const platformTokens = tokensWithBalances
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

  const handleAssetClick = (index: number | null) => {
    if (outsideClick) return;
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
        <DepositInputAmount selectedToken={selectedToken} tokens={tokens} onBack={() => setIsShowDeposits(false)} />
      ) : (
        <DepositTokenSelect
          displayItems={displayItems}
          selectedAsset={selectedAsset}
          hoveredAsset={hoveredAsset}
          isAnyNonActiveHovered={isAnyNonActiveHovered}
          selectedToken={selectedToken}
          handleAssetClick={handleAssetClick}
          handleAssetMouseEnter={handleAssetMouseEnter}
          handleAssetMouseLeave={handleAssetMouseLeave}
          setSelectedToken={setSelectedToken}
          onContinue={!isShowDeposits ? () => setIsShowDeposits(true) : undefined}
          tokenAssetRef={tokenAssetRef}
          apy={apy}
          deposits={deposits}
        />
      )}
    </motion.div>
  );
}

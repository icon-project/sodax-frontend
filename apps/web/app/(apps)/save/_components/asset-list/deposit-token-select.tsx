// apps/web/app/(apps)/save/_components/asset-list/deposit-token-select.tsx
import { motion } from 'motion/react';
import { TokenAsset } from '@/components/shared/token-asset';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { XToken } from '@sodax/types';
import type { DisplayItem } from './asset-list-item-content';
import AssetMetrics from './asset-metrics';

type DepositTokenSelectItemProps = {
  item: DisplayItem;
  idx: number;
  isSelected: boolean;
  selectedToken: XToken | null;
  isAnyNonActiveHovered: boolean;
  selectedAsset: number | null;
  isHovered: boolean;
  isHoverDimmed: boolean;
  handleAssetClick: (index: number) => void;
  setSelectedToken: (token: XToken | null) => void;
  tokenAssetRef?: React.RefObject<HTMLDivElement | null>;
};

// Internal component for rendering a single token select item
function DepositTokenSelectItem({
  item,
  idx,
  isSelected,
  selectedToken,
  isAnyNonActiveHovered,
  selectedAsset,
  isHovered,
  isHoverDimmed,
  handleAssetClick,
  setSelectedToken,
  tokenAssetRef,
}: DepositTokenSelectItemProps) {
  const shared = {
    isClickBlurred: selectedAsset !== null && !isSelected,
    isHoverDimmed,
    isHovered,
    onMouseEnter: () => {},
    onMouseLeave: () => {},
  };

  const renderNormal = () => (
    <TokenAsset
      {...shared}
      key={item.token?.xChainId}
      name={item.token?.symbol || ''}
      token={item.token}
      isHoldToken={item.isHold}
      formattedBalance={item.supplyBalance}
      isGroup={false}
      onClick={() => {
        handleAssetClick(idx);
        setSelectedToken(item.token);
      }}
    />
  );

  const renderGroupCollapsed = () => (
    <TokenAsset
      {...shared}
      key={item.token?.xChainId}
      name={item.token?.symbol || ''}
      token={item.token}
      isHoldToken={item.isHold}
      formattedBalance={item.supplyBalance}
      isGroup={true}
      tokenCount={item.tokenCount}
      tokens={item.tokens}
      isClicked={isSelected}
      onChainClick={(token: XToken) => setSelectedToken(token)}
      onClick={() => handleAssetClick(idx)}
    />
  );

  const renderGroupExpanded = () => (
    <div className="flex -ml-5">
      <div className="blur-sm">
        <TokenAsset
          {...shared}
          key={item.token?.xChainId}
          name={item.token?.symbol || ''}
          token={item.token}
          isHoldToken={item.isHold}
          isGroup={true}
          tokenCount={item.tokenCount}
          tokens={item.tokens}
          onClick={() => {}}
        />
      </div>

      <div className="-ml-13">
        <TokenAsset
          {...shared}
          key={selectedToken?.xChainId}
          name={selectedToken?.symbol || ''}
          token={selectedToken || ({} as XToken)}
          isHoldToken={false}
          isGroup={false}
          onClick={() => setSelectedToken(null)}
        />
      </div>
    </div>
  );

  let content: React.ReactNode;
  if (!item.isGroup) content = renderNormal();
  else if (selectedToken) content = renderGroupExpanded();
  else content = renderGroupCollapsed();

  return <>{content}</>;
}

type Props = {
  displayItems: DisplayItem[];
  selectedAsset: number | null;
  hoveredAsset: number | null;
  isAnyNonActiveHovered: boolean;
  selectedToken: XToken | null;
  handleAssetClick: (index: number) => void;
  handleAssetMouseEnter: (index: number) => void;
  handleAssetMouseLeave: (index: number) => void;
  setSelectedToken: (token: XToken | null) => void;
  onContinue?: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  tokenAssetRef?: React.RefObject<HTMLDivElement | null>;
  apy: string;
  deposits: string;
};

export function DepositTokenSelect({
  displayItems,
  selectedAsset,
  hoveredAsset,
  isAnyNonActiveHovered,
  selectedToken,
  handleAssetClick,
  handleAssetMouseEnter,
  handleAssetMouseLeave,
  setSelectedToken,
  onContinue,
  containerRef,
  tokenAssetRef,
  apy,
  deposits,
}: Props) {
  return (
    <>
      <AssetMetrics apy={apy} deposits={deposits} />
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
              <DepositTokenSelectItem
                item={item}
                idx={idx}
                isSelected={isSelected}
                selectedToken={selectedToken}
                isAnyNonActiveHovered={isAnyNonActiveHovered}
                selectedAsset={selectedAsset}
                isHovered={isHovered}
                isHoverDimmed={shouldDim}
                handleAssetClick={handleAssetClick}
                setSelectedToken={setSelectedToken}
                tokenAssetRef={tokenAssetRef}
              />
            </motion.div>
          );
        })}
      </div>
      <div
        className={cn(
          'flex gap-4 items-center mb-8 transition-all duration-300',
          !selectedToken && selectedAsset !== null && displayItems[selectedAsset]?.isGroup && 'blur filter opacity-30',
        )}
      >
        <div className="flex gap-4 items-center mb-8 transition-all duration-300">
          <Button
            variant="cherry"
            className="w-27 mix-blend-multiply shadow-none"
            disabled={!selectedToken}
            onMouseDown={() => {
              onContinue?.();
            }}
          >
            Continue
          </Button>
          <span className="text-clay text-(length:--body-small) font-['InterRegular']">
            {!selectedToken ? 'Select a source' : 'See your yield next'}
          </span>
        </div>
      </div>
    </>
  );
}

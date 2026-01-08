import { motion } from 'motion/react';
import { TokenAsset } from '@/components/shared/token-asset';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { XToken } from '@sodax/types';
import type { DisplayItem } from './asset-list-item-content';
import AssetMetrics from './asset-metrics';
import { useXAccount } from '@sodax/wallet-sdk-react';
import { useAllChainBalances } from '@/hooks/useAllChainBalances';

type DepositTokenSelectItemProps = {
  item: DisplayItem;
  idx: number;
  isSelected: boolean;
  selectedToken: XToken | null;
  isAnyNonActiveHovered: boolean;
  selectedAsset: number | null;
  isHovered: boolean;
  isHoverDimmed: boolean;
  handleAssetClick: (index: number | null) => void;
  setSelectedToken: (token: XToken | null) => void;
  tokenAssetRef?: React.RefObject<HTMLDivElement | null>;
};

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
          onClick={() => {
            setSelectedToken(null);
            handleAssetClick(null);
          }}
        />
      </div>
    </div>
  );

  let content: React.ReactNode;
  if (!item.isGroup) content = renderNormal();
  else if (selectedToken && isSelected) content = renderGroupExpanded();
  else content = renderGroupCollapsed();
  return <div ref={isSelected ? tokenAssetRef : undefined}>{content}</div>;
}

type Props = {
  displayItems: DisplayItem[];
  selectedAsset: number | null;
  hoveredAsset: number | null;
  isAnyNonActiveHovered: boolean;
  selectedToken: XToken | null;
  handleAssetClick: (index: number | null) => void;
  handleAssetMouseEnter: (index: number) => void;
  handleAssetMouseLeave: (index: number) => void;
  setSelectedToken: (token: XToken | null) => void;
  onContinue?: () => void;
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
  tokenAssetRef,
  apy,
  deposits,
}: Props) {
  const { address: sourceAddress } = useXAccount(selectedToken?.xChainId);
  const allChainBalances = useAllChainBalances();
  const balance = selectedToken
    ? (allChainBalances[selectedToken.address]?.find(entry => entry.chainId === selectedToken.xChainId)?.balance ?? 0n)
    : 0n;
  const isSimulate = !(sourceAddress && balance > 0n);

  return (
    <>
      <AssetMetrics apy={apy} deposits={deposits} />
      <div className="flex flex-wrap -ml-3 -my-[1px]">
        {displayItems.map((item, idx) => {
          const isSelected = selectedAsset === idx;
          const isHovered = selectedAsset === null && hoveredAsset === idx;
          const shouldBlur = selectedAsset !== null && !isSelected;
          const blurAmount = shouldBlur ? (isAnyNonActiveHovered ? 1 : 4) : 0;
          const shouldDim = selectedAsset === null && hoveredAsset !== null && hoveredAsset !== idx;

          return (
            <motion.div
              key={`${item.token.xChainId || 'group'}-${idx}`}
              onMouseEnter={() => handleAssetMouseEnter(idx)}
              onMouseLeave={() => handleAssetMouseLeave(idx)}
              style={{ filter: `blur(${blurAmount}px)` }}
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
            {!selectedToken ? 'Continue' : isSimulate ? 'Simulate' : 'Continue'}
          </Button>
          <span className="text-clay text-(length:--body-small) font-['InterRegular']">
            {!selectedToken ? 'Select a source' : 'See your yield next'}
          </span>
        </div>
      </div>
    </>
  );
}

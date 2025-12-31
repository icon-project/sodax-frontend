// apps/web/app/(apps)/save/_components/asset-list/deposit-token-select.tsx
import { TokenAsset } from '@/components/shared/token-asset';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { XToken } from '@sodax/types';

type Props = {
  item: {
    token: XToken;
    isHold: boolean;
    isGroup?: boolean;
    tokenCount?: number;
    tokens?: XToken[];
    supplyBalance: string;
  };
  idx: number;
  isSelected: boolean;
  selectedToken: XToken | null;
  isAnyNonActiveHovered: boolean;
  selectedAsset: number | null;
  isHovered: boolean;
  isHoverDimmed: boolean;

  handleAssetClick: (index: number) => void;
  setSelectedToken: (token: XToken | null) => void;
  onContinue?: () => void;
};

export function DepositTokenSelect({
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
  onContinue,
}: Props) {
  const shared = {
    isClickBlurred: selectedAsset !== null && !isSelected,
    isHoverDimmed,
    isHovered,
    onMouseEnter: () => {},
    onMouseLeave: () => {},
  };

  const shouldBlur = selectedAsset !== null && !isSelected;
  const blurAmount = shouldBlur ? (isAnyNonActiveHovered ? 1 : 4) : 0;
  const wrapperClass = cn(shouldBlur && 'opacity-40');

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

  return (
    <>
      <div className={wrapperClass} style={{ filter: `blur(${blurAmount}px)` }}>
        {content}
      </div>
      <div
        className={cn(
          'flex gap-4 items-center mb-8 transition-all duration-300',
          !selectedToken && item.isGroup && 'blur filter opacity-30',
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

import { TokenAsset } from '@/components/shared/token-asset';
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
};

export function TokenAssetWrapper({
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
    <div className="flex">
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
    <div className={wrapperClass} style={{ filter: `blur(${blurAmount}px)` }}>
      {content}
    </div>
  );
}

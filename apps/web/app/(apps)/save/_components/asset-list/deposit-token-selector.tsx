import { useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { XToken } from '@sodax/types';
import type { DisplayItem } from './asset-list-item-content';
import { TokenAsset } from '../token-asset/token-asset';
import { useClickAway } from 'react-use';

type DepositTokenSelectItemProps = {
  item: DisplayItem;
  idx: number;
  isSelected: boolean;
  selectedToken: XToken | null;
  isHovered: boolean;
  isHoverDimmed: boolean;
  handleAssetClick: (index: number | null) => void;
  handleTokenDeselect: () => void;
  setSelectNetworkToken: (network: XToken) => void;
  outsideClick: boolean;
};

function DepositTokenSelectItem({
  item,
  idx,
  isSelected,
  selectedToken,
  isHovered,
  isHoverDimmed,
  handleAssetClick,
  handleTokenDeselect,
  setSelectNetworkToken,
  outsideClick,
}: DepositTokenSelectItemProps): React.JSX.Element {
  const shared = {
    isHoverDimmed,
    isHovered,
    setSelectNetworkToken,
    outsideClick,
  };

  const tokenAssetRef = useRef<HTMLDivElement>(null);
  useClickAway(tokenAssetRef, () => {
    if (isSelected) handleTokenDeselect();
  });

  const renderNormal = (): React.JSX.Element => (
    <TokenAsset
      {...shared}
      key={item.tokens?.[0]?.xChainId}
      tokens={item.tokens}
      formattedBalance={item.supplyBalance}
      onClick={() => {
        handleAssetClick(idx);
      }}
    />
  );

  const renderGroupExpanded = (): React.JSX.Element => (
    <div className="flex -ml-5">
      <div className="blur-sm">
        <TokenAsset
          {...shared}
          key={item.tokens?.[0]?.xChainId}
          tokens={item.tokens}
          onClick={() => {}}
          className="pointer-events-none"
        />
      </div>

      <div className="-ml-13">
        <TokenAsset
          {...shared}
          tokens={[selectedToken || ({} as XToken)]}
          key={selectedToken?.xChainId}
          onClick={() => {
            handleTokenDeselect();
          }}
        />
      </div>
    </div>
  );

  let content: React.ReactNode;
  if (isSelected && selectedToken && item?.tokens?.length && item.tokens.length > 1) content = renderGroupExpanded();
  else content = renderNormal();
  return <div ref={tokenAssetRef}>{content}</div>;
}

type DepositTokenSelectorProps = {
  displayItems: DisplayItem[];
  onChange: (token: XToken | null) => void;
};

export function DepositTokenSelector({ displayItems, onChange }: DepositTokenSelectorProps): React.JSX.Element {
  const [selectedAsset, setSelectedAsset] = useState<number | null>(null);
  const [hoveredAsset, setHoveredAsset] = useState<number | null>(null);
  const [selectedToken, setSelectedToken] = useState<XToken | null>(null);
  const [isAnyNonActiveHovered, setIsAnyNonActiveHovered] = useState<boolean>(false);
  const [outsideClick, setOutsideClick] = useState<boolean>(false);

  const handleAssetClick = (index: number | null): void => {
    if (outsideClick) return;
    setSelectedAsset(index);
    setHoveredAsset(null);
    setIsAnyNonActiveHovered(false);
    if (index !== null) {
      const item = displayItems[index];
      if (item?.tokens?.[0] && item.tokens.length === 1) {
        handleTokenSelect(item.tokens[0]);
      }
    }
  };

  const handleAssetMouseEnter = (index: number): void => {
    if (selectedAsset === null) {
      setHoveredAsset(index);
    } else if (selectedAsset !== index) {
      setIsAnyNonActiveHovered(true);
    }
  };

  const handleAssetMouseLeave = (index: number): void => {
    if (selectedAsset === null) {
      setHoveredAsset(null);
    } else if (selectedAsset !== index) {
      setIsAnyNonActiveHovered(false);
    }
  };

  const handleTokenSelect = (token: XToken): void => {
    setSelectedToken(token);
    onChange(token);
  };

  const handleTokenDeselect = (): void => {
    setSelectedToken(null);
    setSelectedAsset(null);
    onChange(null);
    setOutsideClick(true);
    setTimeout(() => {
      setOutsideClick(false);
    }, 100);
  };

  return (
    <div className="flex flex-wrap -ml-3 -my-[1px]">
      {displayItems.map((item, idx) => {
        const isSelected = selectedAsset === idx;
        const isHovered = hoveredAsset === idx;
        const shouldBlur = selectedAsset !== null && !isSelected;
        const blurAmount = shouldBlur ? (isAnyNonActiveHovered ? 1 : 4) : 0;
        const shouldDim = selectedAsset === null && hoveredAsset !== null && hoveredAsset !== idx;

        return (
          <motion.div
            key={`${item.tokens?.[0]?.xChainId}-${idx}`}
            onMouseEnter={() => handleAssetMouseEnter(idx)}
            onMouseLeave={() => handleAssetMouseLeave(idx)}
            style={{ filter: `blur(${blurAmount}px)` }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className={outsideClick ? 'group pointer-events-none' : 'group'}
          >
            <DepositTokenSelectItem
              item={item}
              idx={idx}
              isSelected={isSelected}
              selectedToken={selectedToken}
              isHovered={isHovered}
              isHoverDimmed={shouldDim}
              handleAssetClick={handleAssetClick}
              handleTokenDeselect={handleTokenDeselect}
              setSelectNetworkToken={handleTokenSelect}
              outsideClick={outsideClick}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

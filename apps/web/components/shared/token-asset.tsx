import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import { motion } from 'motion/react';
import { formatBalance, getAllSupportedSolverTokens } from '@/lib/utils';
import { availableChains } from '@/constants/chains';
import NetworkIcon from '@/components/shared/network-icon';
import { createPortal } from 'react-dom';
import { formatUnits } from 'viem';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { ChevronDownIcon } from 'lucide-react';

function NetworkPicker({
  isClicked,
  chainIds,
  tokenSymbol,
  onSelect,
  position,
}: {
  isClicked: boolean;
  chainIds: string[];
  tokenSymbol: string;
  onSelect?: (token: XToken) => void;
  position: { top: number; left: number } | null;
}): React.JSX.Element | null {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);
  const allTokens = getAllSupportedSolverTokens();
  const networks = chainIds.map(id => {
    const chain = availableChains.find(c => c.id === id);
    return { id, name: chain?.name ?? 'Unknown', icon: chain?.icon };
  });

  const handleNetworkClick = (chainId: string): void => {
    const token = allTokens.find(token => token.symbol === tokenSymbol && token.xChainId === chainId);
    if (token) {
      onSelect?.(token);
    }
  };

  if (!isClicked || !position) {
    return null;
  }

  const portalContent = (
    <div
      className="fixed pointer-events-auto z-[53]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translate(-50%, 0)',
      }}
    >
      <div className="font-['InterRegular'] text-(length:--body-small) font-medium text-espresso mb-2 text-center">
        {hoveredIcon !== null && networks[hoveredIcon] ? (
          <>
            {tokenSymbol} <span className="font-bold">on {networks[hoveredIcon].name}</span>
          </>
        ) : (
          'Choose a network'
        )}
      </div>
      <div className="[flex-flow:wrap] box-border content-start flex items-start justify-center p-0 relative shrink-0 w-[130px] overflow-visible pointer-events-auto">
        {networks.map((network, index) => (
          <motion.div
            key={index}
            data-network-icon="true"
            className={`relative shrink-0 cursor-pointer p-2 ${
              hoveredIcon !== null && hoveredIcon !== index ? 'opacity-60 grayscale-[0.5]' : 'opacity-100 grayscale-0'
            }`}
            onMouseEnter={() => setHoveredIcon(index)}
            onMouseLeave={() => setHoveredIcon(null)}
            whileHover={{
              scale: 1.3,
            }}
            onMouseDown={e => {
              e.preventDefault();
              e.stopPropagation();
              handleNetworkClick(chainIds[index] ?? '');
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <NetworkIcon id={network.id} />
          </motion.div>
        ))}
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
}

interface TokenAssetProps {
  name: string;
  token?: XToken;
  sourceBalance: bigint;
  isHoldToken: boolean;
  isClickBlurred: boolean;
  isHoverDimmed: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: (e?: React.MouseEvent) => void;
  // Group-specific props
  isGroup?: boolean;
  tokenCount?: number;
  tokens?: XToken[];
  onChainClick?: (token: XToken) => void;
  isClicked?: boolean;
}

export function TokenAsset({
  name,
  sourceBalance,
  token,
  isHoldToken,
  isClickBlurred,
  isHoverDimmed,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
  isGroup = false,
  tokenCount,
  tokens,
  onChainClick,
  isClicked = false,
}: TokenAssetProps): React.JSX.Element {
  const assetRef = useRef<HTMLDivElement>(null);
  const chainIds = isGroup && tokens ? [...new Set(tokens.map(t => t.xChainId))] : [];
  const [portalPosition, setPortalPosition] = useState<{ top: number; left: number } | null>(null);

  const { data: usdPrice } = useTokenPrice(token || ({} as XToken));
  useEffect(() => {
    if (isClicked && isGroup && assetRef.current) {
      const rect = assetRef.current.getBoundingClientRect();
      setPortalPosition({
        top: rect.bottom - 40,
        left: rect.left + rect.width / 2,
      });
    } else {
      setPortalPosition(null);
    }
  }, [isClicked, isGroup]);

  return (
    <>
      <motion.div
        ref={assetRef}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        whileHover={{
          zIndex: 9999,
        }}
        animate={{
          opacity: isHoverDimmed ? 0.5 : 1,
          scale: isHovered ? 1.1 : 1,
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`px-3 flex flex-col items-center justify-start relative cursor-pointer shrink-0 transition-all duration-200 w-18 pb-4 ${
          isClickBlurred ? 'blur filter opacity-30' : isHoverDimmed ? 'opacity-50' : ''
        } ${isClicked && isGroup ? 'z-[9999]' : ''}`}
        data-name="Asset"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
      >
        <div className="relative">
          {(token || (isGroup && tokens && tokens.length > 0)) && (
            <CurrencyLogo
              currency={token || (tokens && tokens[0]) || ({} as XToken)}
              isGroup={isGroup}
              tokenCount={tokenCount}
              isClicked={isClickBlurred}
              isHovered={isHovered}
            />
          )}
        </div>
        <div
          className={`font-['InterRegular'] flex items-center justify-center text-(length:--body-small) transition-all duration-200 mt-2 ${
            isClicked && isGroup
              ? 'opacity-0'
              : isHovered
                ? 'opacity-100 text-espresso font-bold'
                : isHoldToken
                  ? 'opacity-100 text-espresso font-medium'
                  : 'opacity-100 text-clay font-medium'
          }`}
        >
          {name} {tokenCount && tokenCount > 1 && <ChevronDownIcon className="w-2 h-2 text-clay ml-1" />}
        </div>

        <div className="flex font-medium h-[13px] gap-1">
          {isHoldToken && (
            <div className="flex items-center gap-1 justify-start">
              <motion.p
                className="relative shrink-0 text-clay !text-(length:--text-body-fine-print)"
                animate={{
                  color: isHovered ? '#483534' : '#8e7e7d',
                }}
                transition={{
                  duration: 0.3,
                  ease: 'easeInOut',
                }}
              >
                {formatBalance(formatUnits(sourceBalance, token?.decimals || 0), usdPrice || 0)}
              </motion.p>
            </div>
          )}
        </div>
      </motion.div>
      {isGroup && (
        <NetworkPicker
          isClicked={isClicked}
          chainIds={chainIds}
          tokenSymbol={name}
          onSelect={onChainClick}
          position={portalPosition}
        />
      )}
    </>
  );
}

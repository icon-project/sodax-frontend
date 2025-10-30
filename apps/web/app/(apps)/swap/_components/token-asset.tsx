// apps/web/app/(apps)/swap/_components/token-asset.tsx
import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import { motion } from 'motion/react';
import { getAllSupportedSolverTokens } from '@/lib/utils';
import { availableChains } from '@/constants/chains';
import { ArbitrumIcon } from '@/components/icons/chains/arbitrum';
import { IcxIcon } from '@/components/icons/chains/icon';
import { BaseIcon } from '@/components/icons/chains/base';
import { AvalancheIcon } from '@/components/icons/chains/avalanche';
import { BnbIcon } from '@/components/icons/chains/bnb';
import { PolygonIcon } from '@/components/icons/chains/polygon';
import { SolIcon } from '@/components/icons/chains/sol';
import { StellarIcon } from '@/components/icons/chains/stellar';
import { SuiIcon } from '@/components/icons/chains/sui';
import { InjectiveIcon } from '@/components/icons/chains/injective';
import { SonicIcon } from '@/components/icons/chains/sonic';
import { OptimismIcon } from '@/components/icons/chains/optimism';
import { LightLinkIcon } from '@/components/icons/chains/lightlink';
import { createPortal } from 'react-dom';

interface NetworkIconProps {
  imageSrc: string;
  isHovered: boolean;
  hoveredIcon: number | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}

function NetworkIcon({
  imageSrc,
  isHovered,
  hoveredIcon,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: NetworkIconProps): React.JSX.Element {
  const shouldDim = hoveredIcon !== null && !isHovered;

  return (
    <motion.div
      data-network-icon="true"
      className={`relative shrink-0 cursor-pointer p-2 ${
        shouldDim ? 'opacity-60 grayscale-[0.5]' : 'opacity-100 grayscale-0'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseDown={e => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      animate={{
        scale: isHovered ? 1.3 : 1,
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="ring ring-2 ring-white shadow-[-2px_0px_2px_0px_rgba(175,145,145,1)] rounded rounded-[4px]">
        {imageSrc === 'Icon' && <IcxIcon />}
        {imageSrc === 'Avalanche' && <AvalancheIcon />}
        {imageSrc === 'Base' && <BaseIcon />}
        {imageSrc === 'BNB' && <BnbIcon />}
        {imageSrc === 'Polygon' && <PolygonIcon />}
        {imageSrc === 'Solana' && <SolIcon />}
        {imageSrc === 'Stellar' && <StellarIcon />}
        {imageSrc === 'Sui' && <SuiIcon />}
        {imageSrc === 'Injective' && <InjectiveIcon />}
        {imageSrc === 'Sonic' && <SonicIcon />}
        {imageSrc === 'Optimism' && <OptimismIcon />}
        {imageSrc === 'Arbitrum' && <ArbitrumIcon />}
        {imageSrc === 'LightLink' && <LightLinkIcon />}
      </div>
    </motion.div>
  );
}

interface StackedNetworksProps {
  isClicked: boolean;
  chainIds: string[];
  tokenSymbol: string;
  onChainClick?: (token: XToken) => void;
  position: { top: number; left: number } | null;
}

function StackedNetworks({
  isClicked,
  chainIds,
  tokenSymbol,
  onChainClick,
  position,
}: StackedNetworksProps): React.JSX.Element | null {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);
  const allSupportedTokens = getAllSupportedSolverTokens();

  const getNetworkInfo = (chainId: string): { image: string; name: string } => {
    const chain = availableChains.find(chain => chain.id === chainId);
    return chain ? { image: chain.icon, name: chain.name } : { image: '/chain/sonic.png', name: 'Sonic' };
  };

  const networkInfos = chainIds.map(chainId => getNetworkInfo(chainId));

  const handleNetworkClick = (chainId: string): void => {
    if (onChainClick) {
      const token = allSupportedTokens.find(token => token.symbol === tokenSymbol && token.xChainId === chainId);
      if (token) {
        onChainClick(token);
      }
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
        {hoveredIcon !== null && networkInfos[hoveredIcon] ? (
          <>
            {tokenSymbol} <span className="font-bold">on {networkInfos[hoveredIcon].name}</span>
          </>
        ) : (
          'Choose a network'
        )}
      </div>
      <div className="[flex-flow:wrap] box-border content-start flex items-start justify-center p-0 relative shrink-0 w-[130px] overflow-visible pointer-events-auto">
        {networkInfos.map((networkInfo, index) => (
          <NetworkIcon
            key={index}
            imageSrc={networkInfo.name}
            isHovered={hoveredIcon === index}
            hoveredIcon={hoveredIcon}
            onMouseEnter={() => setHoveredIcon(index)}
            onMouseLeave={() => setHoveredIcon(null)}
            onClick={() => handleNetworkClick(chainIds[index] ?? '')}
          />
        ))}
      </div>
    </div>
  );

  return createPortal(portalContent, document.body);
}

interface TokenAssetProps {
  name: string;
  token?: XToken;
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
  token,
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

  useEffect(() => {
    if (isClicked && isGroup && assetRef.current) {
      const rect = assetRef.current.getBoundingClientRect();
      setPortalPosition({
        top: rect.bottom - 30,
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
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: isHoverDimmed ? 0.5 : 1,
          scale: isHovered ? 1.1 : 1,
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`px-2 flex flex-col gap-2 items-center justify-start relative cursor-pointer shrink-0 transition-all duration-200 pb-3 ${
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
        <div className="relative h-6 w-full">
          <div
            className={`font-['InterRegular'] leading-[0] absolute inset-0 flex items-center justify-center text-(length:--body-small) transition-all duration-200 ${
              isClicked && isGroup
                ? 'opacity-0'
                : isHovered
                  ? 'opacity-100 text-espresso font-bold'
                  : 'opacity-100 text-clay font-medium'
            }`}
          >
            {name}
          </div>
        </div>
      </motion.div>
      {isGroup && (
        <StackedNetworks
          isClicked={isClicked}
          chainIds={chainIds}
          tokenSymbol={name}
          onChainClick={onChainClick}
          position={portalPosition}
        />
      )}
    </>
  );
}

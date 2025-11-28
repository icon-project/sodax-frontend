// apps/web/app/(apps)/swap/_components/token-asset.tsx
import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { XToken } from '@sodax/types';
import CurrencyLogo from '@/components/shared/currency-logo';
import { motion } from 'motion/react';
import { formatBalance, getAllSupportedSolverTokens } from '@/lib/utils';
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
import { EthereumIcon } from '@/components/icons/chains/ethereum';
import { HyperIcon } from '@/components/icons/chains/hyper';
import { createPortal } from 'react-dom';
import { formatUnits } from 'viem';
import { useTokenPrice } from '@/hooks/useTokenPrice';
import { ChevronDownIcon } from 'lucide-react';

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
      whileHover={{
        scale: 1.3,
      }}
      onMouseDown={e => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      <div className="ring-2 ring-white shadow-[-2px_0px_2px_0px_rgba(175,145,145,1)] rounded">
        {imageSrc === 'ICON' && <IcxIcon />}
        {imageSrc === 'Avalanche' && <AvalancheIcon />}
        {imageSrc === 'Base' && <BaseIcon />}
        {imageSrc === 'BSC' && <BnbIcon />}
        {imageSrc === 'Polygon' && <PolygonIcon />}
        {imageSrc === 'Solana' && <SolIcon />}
        {imageSrc === 'Stellar' && <StellarIcon />}
        {imageSrc === 'Sui' && <SuiIcon />}
        {imageSrc === 'Injective' && <InjectiveIcon />}
        {imageSrc === 'Sonic' && <SonicIcon />}
        {imageSrc === 'Optimism' && <OptimismIcon />}
        {imageSrc === 'Arbitrum' && <ArbitrumIcon />}
        {imageSrc === 'LightLink' && <LightLinkIcon />}
        {imageSrc === 'Ethereum' && <EthereumIcon />}
        {imageSrc === 'Hyper' && <HyperIcon />}
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
                // layout="position"
                animate={{
                  // x: isHovered ? -2 : 0,
                  color: isHovered ? '#483534' : '#8e7e7d',
                }}
                transition={{
                  duration: 0.3,
                  ease: 'easeInOut',
                }}
              >
                {formatBalance(formatUnits(sourceBalance, token?.decimals || 0), usdPrice || 0)}
              </motion.p>
              {/* <AnimatePresence>
                {isHovered && (
                  <motion.p
                    className="shrink-0 text-clay !text-(length:--text-body-fine-print)"
                    animate={{
                      opacity: isHovered ? 1 : 0,
                      x: isHovered ? 2 : 0,
                    }}
                    transition={{
                      duration: 0.3,
                      ease: 'easeInOut',
                    }}
                  >
                    {`$(${new BigNumber(formatUnits(sourceBalance, token?.decimals || 0))
                      .multipliedBy(usdPrice || 0)
                      .toFixed(2)})`}
                  </motion.p>
                )}
              </AnimatePresence> */}
            </div>
          )}
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

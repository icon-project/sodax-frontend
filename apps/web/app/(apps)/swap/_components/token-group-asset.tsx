import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { XToken } from '@sodax/types';
import { getAllSupportedSolverTokens } from '@/lib/utils';
import { availableChains } from '@/constants/chains';
import { motion } from 'motion/react';

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
    <div
      className={`relative rounded shrink-0 transition-all duration-200 cursor-pointer ring ring-2 ring-white rounded-[4px] shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.2)] ${
        shouldDim ? 'opacity-60 grayscale-[0.5]' : 'opacity-100 grayscale-0'
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <Image src={imageSrc} alt="Network Icon" width={16} height={16} className="rounded-[4px]" />
    </div>
  );
}

interface StackedNetworksProps {
  isClicked: boolean;
  chainIds: string[];
  tokenSymbol: string;
  onChainClick?: (token: XToken) => void;
}

function StackedNetworks({
  isClicked,
  chainIds,
  tokenSymbol,
  onChainClick,
}: StackedNetworksProps): React.JSX.Element | null {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);
  const allSupportedTokens = getAllSupportedSolverTokens();

  const getNetworkInfo = (chainId: string): { image: string; name: string } => {
    const chain = availableChains.find(chain => chain.id === chainId);
    return chain ? { image: chain.icon16, name: chain.name } : { image: '/chain/sonic.png', name: 'Sonic' }; // fallback
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

  if (!isClicked) {
    return null;
  }

  return (
    <div className="absolute -top-6 z-10000 pointer-events-auto">
      <div className="font-['InterRegular'] text-(length:--body-small) font-medium text-espresso mt-6 mb-2 text-center">
        {hoveredIcon !== null && networkInfos[hoveredIcon] ? (
          <>
            {tokenSymbol} <span className="font-bold">on {networkInfos[hoveredIcon].name}</span>
          </>
        ) : (
          'Choose a network'
        )}
      </div>
      <div className="[flex-flow:wrap] box-border content-start flex gap-1 items-start justify-center p-0 relative shrink-0 w-[130px] z-51 overflow-visible pointer-events-auto gap-4">
        {networkInfos.map((networkInfo, index) => (
          <NetworkIcon
            key={index}
            imageSrc={networkInfo.image}
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
}

interface StackedNetworksPortalProps {
  isClicked: boolean;
  chainIds: string[];
  tokenSymbol: string;
  onChainClick: (token: XToken) => void;
  targetRef: React.RefObject<HTMLDivElement | null>;
}

function StackedNetworksPortal({
  isClicked,
  chainIds,
  tokenSymbol,
  onChainClick,
  targetRef,
}: StackedNetworksPortalProps): React.JSX.Element | null {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isClicked && targetRef.current) {
      let container = document.getElementById('stacked-networks-portal');
      if (!container) {
        container = document.createElement('div');
        container.id = 'stacked-networks-portal';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.pointerEvents = 'none';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
      }
      setPortalContainer(container);
    } else {
      setPortalContainer(null);
    }

    return () => {
      if (!isClicked) {
        const container = document.getElementById('stacked-networks-portal');
        if (container) {
          document.body.removeChild(container);
        }
      }
    };
  }, [isClicked, targetRef]);

  if (!isClicked || !portalContainer || !targetRef.current) {
    return null;
  }

  const targetRect = targetRef.current.getBoundingClientRect();

  return createPortal(
    <div
      style={{
        position: 'absolute',
        top: targetRect.top + 60,
        left: targetRect.left - 30,
        pointerEvents: 'auto',
      }}
      onMouseDown={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <StackedNetworks
        isClicked={isClicked}
        chainIds={chainIds}
        tokenSymbol={tokenSymbol}
        onChainClick={onChainClick}
      />
    </div>,
    portalContainer,
  );
}

interface CurrencyGroupLogoProps {
  symbol: string;
  tokenCount: number;
  isClicked: boolean;
  isHovered?: boolean;
  isHoverDimmed?: boolean;
}

function CurrencyGroupLogo({
  symbol,
  tokenCount,
  isClicked,
  isHovered,
  isHoverDimmed,
}: CurrencyGroupLogoProps): React.JSX.Element {
  return (
    <>
      <div className={`w-12 h-12 relative justify-center flex ${isHoverDimmed ? 'opacity-50' : ''}`}>
        <div className="w-12 h-12 bg-gradient-to-br from-white to-zinc-100 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.20)]" />
        <div className="left-[12px] top-[12px] absolute bg-white rounded-[256px] inline-flex flex-col justify-start items-start overflow-hidden">
          <Image
            className="w-6 h-6 rounded-[256px]"
            src={`/coin/${symbol.toLowerCase()}.png`}
            alt={symbol}
            width={24}
            height={24}
          />
        </div>
        <div className="transition-opacity duration-200" style={{ opacity: isClicked ? 0 : 1 }}>
          <div
            className="absolute bg-white bottom-[4.17%] box-border content-stretch flex flex-col items-center justify-center p-0 rounded top-[62.5%] translate-x-[-50%] left-[95%] w-4 transition-transform duration-200"
            style={{
              transform: `translateX(-50%) ${isHovered ? 'scale(1.2)' : 'scale(1)'}`,
            }}
          >
            <div className="w-4 h-4 relative bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,1)] ring ring-2 ring-white inline-flex flex-col justify-center items-center">
              <div className="w-3 h-4 left-[4px] top-0 absolute mix-blend-multiply bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,1)] ring ring-2 ring-white" />
              <div className="left-[6px] top-[3px] absolute inline-flex justify-start items-center">
                <div
                  className={`justify-start text-espresso text-[8px] font-medium font-['InterRegular'] leading-[1.2] ${isHovered ? 'font-bold' : 'font-medium'}`}
                >
                  {tokenCount}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative h-6 w-full">
        <div
          className={`font-['InterRegular'] leading-[0] not-italic absolute inset-0 flex items-center justify-center text-(length:--body-small) transition-all duration-200 ${
            isClicked
              ? 'opacity-0'
              : isHovered
                ? 'opacity-100 text-espresso font-bold'
                : 'opacity-100 text-clay font-medium'
          }`}
        >
          {symbol}
        </div>
      </div>
    </>
  );
}

interface TokenGroupAssetProps {
  symbol: string;
  tokenCount: number;
  tokens: XToken[];
  isClicked: boolean;
  isBlurred: boolean;
  onClick: (e: React.MouseEvent) => void;
  isHovered: boolean;
  isHoverDimmed: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onChainClick: (token: XToken) => void;
}

export function TokenGroupAsset({
  symbol,
  tokenCount,
  tokens,
  isClicked,
  isBlurred,
  onClick,
  isHovered,
  isHoverDimmed,
  onMouseEnter,
  onMouseLeave,
  onChainClick,
}: TokenGroupAssetProps): React.JSX.Element {
  const chainIds = [...new Set(tokens.map(token => token.xChainId))];
  const assetRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: isHovered ? 1.1 : 1,
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        ref={assetRef}
        className={`px-2 flex flex-col gap-2 items-center justify-start relative shrink-0 cursor-pointer transition-all duration-200 ${
          isBlurred ? 'blur filter opacity-30' : ''
        }`}
        data-name="Asset"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <CurrencyGroupLogo
          symbol={symbol}
          tokenCount={tokenCount}
          isClicked={isClicked}
          isHovered={isHovered}
          isHoverDimmed={isHoverDimmed}
        />
      </motion.div>
      <StackedNetworksPortal
        isClicked={isClicked}
        chainIds={chainIds}
        tokenSymbol={symbol}
        onChainClick={onChainClick}
        targetRef={assetRef}
      />
    </>
  );
}

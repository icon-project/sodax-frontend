import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { XToken } from '@sodax/types';
import { getAllSupportedSolverTokens } from '@/lib/utils';
import { availableChains } from '@/constants/chains';

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
      className="p-2 cursor-pointer transition-all duration-200 pointer-events-auto"
      data-name="Networks hit area"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div
        className={`bg-white h-[18.4px] relative rounded shrink-0 transition-all duration-200 ${
          shouldDim ? 'opacity-60 grayscale-[0.5]' : 'opacity-100 grayscale-0'
        }`}
        data-name="Networks medium"
        style={{
          transform: isHovered ? 'scale(1.3)' : 'scale(1)',
        }}
      >
        <div className="box-border content-stretch flex flex-col h-[18.4px] items-center justify-center overflow-clip p-0 relative">
          <div
            className="bg-center bg-cover bg-no-repeat shrink-0 w-[18.4px] h-[18.4px]"
            data-name="Networks IMG"
            style={{ backgroundImage: `url('${imageSrc}')` }}
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute border-2 border-white border-solid inset-[-2px] rounded-md shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.1)]"
        />
      </div>
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
    return chain ? { image: chain.icon, name: chain.name } : { image: '/chain/sonic.png', name: 'Sonic' }; // fallback
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
      <div
        className="[flex-flow:wrap] box-border content-start flex gap-1 items-start justify-center p-0 relative shrink-0 w-[164px] z-51 overflow-visible pointer-events-auto"
        data-name="Stacked networks"
      >
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
        left: targetRect.left - 40,
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
}

function CurrencyGroupLogo({ symbol, tokenCount, isClicked, isHovered }: CurrencyGroupLogoProps): React.JSX.Element {
  return (
    <>
      <div className="w-16 h-14 relative">
        <div data-property-1="Default" className="w-12 h-12 left-[8px] top-[4px] absolute">
          <div className="w-12 h-12 left-0 top-0 absolute bg-gradient-to-br from-white to-zinc-100 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.20)]" />
          <div
            data-property-1="Default"
            className="left-[12px] top-[12px] absolute bg-White rounded-[256px] inline-flex flex-col justify-start items-start overflow-hidden"
          >
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
              className="absolute bg-white bottom-[4.17%] box-border content-stretch flex flex-col items-center justify-center p-0 rounded top-[62.5%] translate-x-[-50%] w-4 transition-transform duration-200"
              data-name="Networks medium"
              style={{
                left: 'calc(50% + 14px)',
                transform: `translateX(-50%) ${isHovered ? 'scale(1.2)' : 'scale(1)'}`,
              }}
            >
              <div
                aria-hidden="true"
                className="absolute border-2 border-white border-solid inset-[-2px] pointer-events-none rounded-md shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.1)]"
              />
              <div
                className="absolute bg-white h-4 left-1 mix-blend-multiply rounded top-0 w-3"
                data-name="Networks medium/Variant8"
              >
                <div
                  aria-hidden="true"
                  className="absolute border-2 border-white border-solid inset-[-2px] pointer-events-none rounded-md shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.1)]"
                />
              </div>
              <div
                className="absolute box-border content-stretch flex flex-row items-center justify-start p-0 top-[3px] translate-x-[-50%]"
                data-name="Counter"
                style={{ left: 'calc(50% + 2px)' }}
              >
                <div
                  className={`font-['InterRegular'] leading-[0] not-italic relative shrink-0 text-espresso text-[8px] text-left text-nowrap transition-all duration-200 ${
                    isHovered ? 'font-bold' : 'font-medium'
                  }`}
                >
                  <p className="block leading-[1.2] whitespace-pre">{tokenCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="relative h-6 w-full">
        <div
          className={`font-['InterRegular'] leading-[0] not-italic absolute inset-0 flex items-center justify-center text-[12px] transition-all duration-200 ${
            isClicked
              ? 'opacity-0'
              : isHovered
                ? 'opacity-100 text-espresso font-bold'
                : 'opacity-100 text-clay font-medium'
          }`}
        >
          <p className="block leading-[1.4] whitespace-pre">{symbol}</p>
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
  onMouseEnter,
  onMouseLeave,
  onChainClick,
}: TokenGroupAssetProps): React.JSX.Element {
  const chainIds = [...new Set(tokens.map(token => token.xChainId))];
  const assetRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={assetRef}
        className={`box-border content-stretch flex flex-col gap-2 items-center justify-start px-4 relative shrink-0 cursor-pointer transition-all duration-200 ${
          isBlurred ? 'blur filter opacity-30' : ''
        }`}
        data-name="Asset"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        <CurrencyGroupLogo symbol={symbol} tokenCount={tokenCount} isClicked={isClicked} isHovered={isHovered} />
      </div>
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

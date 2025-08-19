import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { XIcon, ChevronDownIcon, ChevronUpIcon, SearchIcon, LayoutGrid } from 'lucide-react';
import { SPOKE_CHAIN_IDS, type SpokeChainId, type XToken } from '@sodax/types';
import { getAllSupportedSolverTokens, getSupportedSolverTokensForChain } from '@/lib/utils';
import { getUniqueTokenSymbols } from '@/lib/token-utils';
import { Dialog, DialogTitle, DialogContent, DialogHeader, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

const availableChains = [
  { id: SPOKE_CHAIN_IDS[0], name: 'Sonic', icon: '/chain/sonic.png' },
  { id: SPOKE_CHAIN_IDS[1], name: 'Avalanche', icon: '/chain/0xa86a.avax.png' },
  { id: SPOKE_CHAIN_IDS[2], name: 'Arbitrum', icon: '/chain/0xa4b1.arbitrum.png' },
  { id: SPOKE_CHAIN_IDS[3], name: 'Base', icon: '/chain/0x2105.base.png' },
  { id: SPOKE_CHAIN_IDS[4], name: 'BSC', icon: '/chain/0x38.bsc.png' },
  { id: SPOKE_CHAIN_IDS[5], name: 'Injective', icon: '/chain/injective-1.png' },
  { id: SPOKE_CHAIN_IDS[6], name: 'Sui', icon: '/chain/sui.png' },
  { id: SPOKE_CHAIN_IDS[7], name: 'Optimism', icon: '/chain/0xa.optimism.png' },
  { id: SPOKE_CHAIN_IDS[8], name: 'Polygon', icon: '/chain/0x89.polygon.png' },
  { id: SPOKE_CHAIN_IDS[9], name: 'Solana', icon: '/chain/solana.png' },
  { id: SPOKE_CHAIN_IDS[11], name: 'Stellar', icon: '/chain/stellar.png' },
  { id: SPOKE_CHAIN_IDS[10], name: 'Icon', icon: '/chain/0x1.icon.png' },
  { id: SPOKE_CHAIN_IDS[12], name: 'Nibiru', icon: '/chain/nibiru.png' },
];

function SearchBar({
  isUsdtClicked,
  searchQuery,
  onSearchChange,
  handleChainSelectorClick,
  isChainSelectorOpen,
  handleShowAllChains,
  handleChainSelect,
}: {
  isUsdtClicked: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  handleChainSelectorClick: () => void;
  isChainSelectorOpen: boolean;
  handleShowAllChains: () => void;
  handleChainSelect: (chainId: string) => void;
}) {
  return (
    <div
      className={`box-border content-stretch flex flex-col gap-2 items-center justify-start p-0 relative shrink-0 transition-all duration-200 ${
        isUsdtClicked ? 'blur filter opacity-30' : ''
      }`}
      data-name="Row"
    >
      <div className="w-full flex justify-center">
        <div
          data-property-1="Default"
          className={`w-64 h-12 px-6 rounded-[32px] outline outline-4 outline-offset-[-4px] outline-cream-white inline-flex justify-between items-center transition-all duration-200
          }`}
        >
          <div className="flex items-center">
            {isChainSelectorOpen ? (
              <LayoutGrid className="w-4 h-4 text-clay" />
            ) : (
              <SearchIcon className="w-4 h-4 text-clay" />
            )}
            <div className="flex justify-start items-center">
              <Input
                type="text"
                placeholder={isChainSelectorOpen ? 'Select a network' : 'Search tokens...'}
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                readOnly={isChainSelectorOpen}
                className="text-(length:--body-super-comfortable) p-2 border-none focus:border-none shadow-none text-clay-light focus:outline-none focus:ring-0 focus:shadow-none focus-visible:border-none focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="relative">
            <div className="flex justify-start items-center gap-2 cursor-pointer" onClick={handleChainSelectorClick}>
              <div
                data-property-1="Search networks"
                className="w-6 h-6 rounded-sm shadow-[-4px_0px_10px_0px_rgba(175,145,145,0.04)] flex justify-center items-center gap-1 flex-wrap content-center overflow-hidden"
              >
                <Image src="/chain/0x2105.base.png" alt="Base" width={8} height={8} className="rounded-[2px]" />
                <Image src="/chain/solana.png" alt="Solana" width={8} height={8} className="rounded-[2px]" />
                <Image src="/chain/0xa4b1.arbitrum.png" alt="Arbitrum" width={8} height={8} className="rounded-[2px]" />
                <Image src="/chain/sui.png" alt="Sui" width={8} height={8} className="rounded-[2px]" />
              </div>
              {isChainSelectorOpen ? (
                <ChevronUpIcon className="w-4 h-4 text-clay transition-transform duration-200" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-clay transition-transform duration-200" />
              )}
            </div>

            {isChainSelectorOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="absolute inset-0 bg-transparent" onClick={handleChainSelectorClick} />
                <div className="relative bg-transparent border-none w-80 overflow-hidden">
                  <div className="p-4 mt-10">
                    <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                      {availableChains.map(chain => (
                        <div
                          key={chain.id}
                          className="w-34 inline-flex justify-start items-center gap-4 cursor-pointer"
                          onClick={() => handleChainSelect(chain.id)}
                        >
                          <div className="border border-4 border-white rounded-[6px]">
                            <Image src={chain.icon} alt={chain.name} width={24} height={24} className="rounded-[6px]" />
                          </div>
                          <div className="flex justify-start items-center gap-1">
                            <div className="justify-center text-espresso text-base font-normal font-['InterRegular'] leading-tight">
                              {chain.name}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function NetworkIcon({
  imageSrc,
  index,
  isHovered,
  hoveredIcon,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  imageSrc: string;
  index: number;
  isHovered: boolean;
  hoveredIcon: number | null;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  const shouldDim = hoveredIcon !== null && !isHovered;

  return (
    <div
      className="p-2 cursor-pointer transition-all duration-200"
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
          className="absolute border-2 border-white border-solid inset-[-2px] pointer-events-none rounded-md shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.1)]"
        />
      </div>
    </div>
  );
}

function StackedNetworks({
  isClicked,
  chainIds,
  tokenSymbol,
  onChainClick,
}: {
  isClicked: boolean;
  chainIds: string[];
  tokenSymbol: string;
  onChainClick?: (token: XToken) => void;
}) {
  const [hoveredIcon, setHoveredIcon] = useState<number | null>(null);
  const allSupportedTokens = getAllSupportedSolverTokens();

  const getNetworkInfo = (chainId: string): { image: string; name: string } => {
    const chain = availableChains.find(chain => chain.id === chainId);
    return chain ? { image: chain.icon, name: chain.name } : { image: '/chain/sonic.png', name: 'Sonic' }; // fallback
  };

  const networkInfos = chainIds.map(chainId => getNetworkInfo(chainId));

  const handleNetworkClick = (chainId: string) => {
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
    <div className="absolute -top-6 z-10000">
      <div className="font-['InterRegular'] text-(length:--body-small) font-medium text-espresso mt-4 mb-2 text-center">
        {hoveredIcon !== null && networkInfos[hoveredIcon] ? (
          <>
            {tokenSymbol} <span className="font-bold">on {networkInfos[hoveredIcon].name}</span>
          </>
        ) : (
          'Choose a network'
        )}
      </div>
      <div
        className="[flex-flow:wrap] box-border content-start flex gap-1 items-start justify-center p-0 relative shrink-0 w-[164px] z-51 overflow-visible"
        data-name="Stacked networks"
      >
        {networkInfos.map((networkInfo, index) => (
          <NetworkIcon
            key={index}
            imageSrc={networkInfo.image}
            index={index}
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

function SingleNetworkBadge({
  networkImage,
  isHovered,
  tokenSymbol,
  chainName,
}: {
  networkImage: string;
  isHovered?: boolean;
  tokenSymbol?: string;
  chainName?: string;
}) {
  return (
    <div className="relative w-15 h-12">
      <div
        className="absolute bg-white bottom-[4.17%] rounded top-[62.5%] translate-x-[-50%] transition-transform duration-200"
        data-name="Networks medium"
        style={{
          left: 'calc(50% + 14px)',
          transform: `translateX(-50%) ${isHovered ? 'scale(1.2)' : 'scale(1)'}`,
        }}
      >
        <div className="box-border content-stretch flex flex-col h-full items-center justify-center overflow-clip p-0 relative">
          <img
            src={networkImage}
            alt={`${chainName || 'Network'} badge`}
            className="shrink-0 size-4 rounded"
            onError={e => {
              console.warn(`Failed to load network image: ${networkImage}`);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute border-2 border-white border-solid inset-[-2px] pointer-events-none rounded-md shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.4)]"
        />
      </div>
    </div>
  );
}

function CounterBadge({ count, isHovered }: { count: string; isHovered?: boolean }) {
  return (
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
          className={`font-['Inter:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-espresso text-[8px] text-left text-nowrap transition-all duration-200 ${
            isHovered ? 'font-bold' : 'font-medium'
          }`}
        >
          <p className="block leading-[1.2] whitespace-pre">{count}</p>
        </div>
      </div>
    </div>
  );
}

// Dynamic Asset Image component
function DynamicAssetsImg({ symbol }: { symbol: string }) {
  return (
    <div
      className="bg-no-repeat bg-size-[100%_100%] bg-top-left rounded-[256px] shrink-0 size-6"
      data-name="Assets IMG"
      style={{ backgroundImage: `url('/coin/${symbol.toLowerCase()}.png')` }}
    />
  );
}

function DynamicAssetsBig({ symbol }: { symbol: string }) {
  return (
    <div
      className="absolute bg-white bottom-1/4 box-border content-stretch flex flex-col items-start justify-start left-1/2 overflow-clip p-0 rounded-[256px] top-1/4 translate-x-[-50%]"
      data-name="Assets big"
    >
      <DynamicAssetsImg symbol={symbol} />
    </div>
  );
}

function DynamicFullAssetBig({
  symbol,
  tokenCount,
  isClicked,
  isHovered,
}: {
  symbol: string;
  tokenCount: number;
  isClicked: boolean;
  isHovered?: boolean;
}) {
  return (
    <div
      className="relative shrink-0 size-12 transition-all duration-200 ease-out"
      data-name="Full asset big"
      style={{
        transform: isClicked ? 'translateY(-8px)' : 'translateY(0px)',
      }}
    >
      <div className="absolute inset-0 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.2)]" />
      <DynamicAssetsBig symbol={symbol} />
      <div className="transition-opacity duration-200" style={{ opacity: isClicked ? 0 : 1 }}>
        <CounterBadge count={tokenCount.toString()} isHovered={isHovered} />
      </div>
    </div>
  );
}

// Portal component for StackedNetworks to render outside scroll area
function StackedNetworksPortal({
  isClicked,
  chainIds,
  tokenSymbol,
  onChainClick,
  targetRef,
}: {
  isClicked: boolean;
  chainIds: string[];
  tokenSymbol: string;
  onChainClick: (token: XToken) => void;
  targetRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isClicked && targetRef.current) {
      // Create a portal container if it doesn't exist
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
      // Clean up portal container when component unmounts or isClicked becomes false
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

function GroupAsset({
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
}: {
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
}) {
  // Extract unique chain IDs from the tokens in this group
  const chainIds = [...new Set(tokens.map(token => token.xChainId))];
  const assetRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <motion.div
        ref={assetRef}
        layout
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: isHovered ? 1.1 : 1,
        }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={`box-border content-stretch flex flex-col gap-2 items-center justify-start px-4 relative shrink-0 cursor-pointer transition-all duration-200 ${
          isBlurred ? 'blur filter opacity-30' : ''
        }`}
        data-name="Asset"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <DynamicFullAssetBig symbol={symbol} tokenCount={tokenCount} isClicked={isClicked} isHovered={isHovered} />
        <div className="relative h-6 w-full">
          <div
            className={`font-['Inter:Medium',_sans-serif] leading-[0] not-italic absolute inset-0 flex items-center justify-center text-[12px] transition-all duration-200 ${
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

function SimpleAsset({
  name,
  imageUrl,
  networkBadge,
  isClickBlurred,
  isHoverDimmed,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  name: string;
  imageUrl: string;
  networkBadge?: React.ReactNode;
  isClickBlurred: boolean;
  isHoverDimmed: boolean;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: isHovered ? 1.1 : 1,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`box-border content-stretch flex flex-col gap-2 items-center justify-start px-4 relative cursor-pointer shrink-0 transition-all duration-200 ${
        isClickBlurred ? 'blur filter opacity-30' : isHoverDimmed ? 'opacity-50' : ''
      }`}
      data-name="Asset"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <div className="relative shrink-0 size-12" data-name="Full asset big">
        <div className="absolute inset-0 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.2)]" />
        <div
          className="absolute bg-white bottom-1/4 box-border content-stretch flex flex-col items-start justify-start left-1/2 overflow-clip p-0 rounded-[256px] top-1/4 translate-x-[-50%]"
          data-name="Assets big"
        >
          <div
            className="bg-center bg-cover bg-no-repeat rounded-[256px] shrink-0 size-6"
            data-name="Assets IMG"
            style={{ backgroundImage: `url('${imageUrl}')` }}
          />
        </div>
        {React.isValidElement(networkBadge)
          ? React.cloneElement(networkBadge as React.ReactElement, { isHovered } as { isHovered?: boolean })
          : networkBadge}
      </div>
      <div
        className={`font-['Inter:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[12px] text-left text-nowrap transition-all duration-200 ${
          isHovered ? 'text-espresso font-bold' : 'text-clay font-medium'
        }`}
      >
        <p className="block leading-[1.4] whitespace-pre">{name}</p>
      </div>
    </motion.div>
  );
}

function Assets({
  clickedAsset,
  onAssetClick,
  onClickOutside,
  searchQuery,
  onTokenSelect,
  onClose,
  selectedChainFilter,
  isChainSelectorOpen,
}: {
  clickedAsset: string | null;
  onAssetClick: (e: React.MouseEvent, symbol: string) => void;
  onClickOutside: () => void;
  searchQuery: string;
  onTokenSelect?: (token: XToken) => void;
  onClose: () => void;
  selectedChainFilter: SpokeChainId | null;
  isChainSelectorOpen: boolean;
}) {
  const assetsRef = useRef<HTMLDivElement>(null);
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

  const allSupportedTokens = selectedChainFilter
    ? getSupportedSolverTokensForChain(selectedChainFilter)
    : getAllSupportedSolverTokens();

  const uniqueTokenSymbols = getUniqueTokenSymbols(allSupportedTokens);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (assetsRef.current && !assetsRef.current.contains(event.target as Node) && clickedAsset !== null) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [clickedAsset, onClickOutside]);

  // Filter unique token symbols based on search query
  const filteredTokenSymbols = uniqueTokenSymbols.filter(({ symbol }) =>
    symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const shouldApplyHover = clickedAsset === null;

  const handleSimpleAssetClick = (token: XToken) => {
    if (onTokenSelect) {
      onTokenSelect(token);
      onClose();
    }
  };

  const handleChainClick = (token: XToken) => {
    console.log('handleChainClick called with token:', token);
    if (onTokenSelect) {
      onTokenSelect(token);
      onClose();
    }
  };

  const renderTokenSymbol = ({ symbol, tokens }: { symbol: string; tokens: XToken[] }) => {
    const tokenCount = tokens.length;
    const isHovered = shouldApplyHover && hoveredAsset === symbol;
    const isThisAssetClicked = clickedAsset === symbol;

    // Blur all other assets when one is clicked
    const shouldBlurOtherAssets = clickedAsset !== null && clickedAsset !== symbol;

    const commonProps = {
      isClickBlurred: shouldBlurOtherAssets,
      isHoverDimmed: shouldApplyHover && hoveredAsset !== null && hoveredAsset !== symbol,
      isHovered,
      onMouseEnter: () => shouldApplyHover && setHoveredAsset(symbol),
      onMouseLeave: () => shouldApplyHover && setHoveredAsset(null),
    };

    // When token count > 1, use GroupAsset component
    if (tokenCount > 1) {
      return (
        <GroupAsset
          key={symbol}
          symbol={symbol}
          tokenCount={tokenCount}
          tokens={tokens}
          isClicked={isThisAssetClicked}
          isBlurred={shouldBlurOtherAssets}
          onClick={e => onAssetClick(e, symbol)}
          isHovered={isHovered}
          onMouseEnter={() => shouldApplyHover && setHoveredAsset(symbol)}
          onMouseLeave={() => shouldApplyHover && setHoveredAsset(null)}
          onChainClick={handleChainClick}
        />
      );
    }

    const singleToken = tokens[0];
    if (!singleToken) return null;

    const getChainName = (chainId: string): string => {
      const chain = availableChains.find(chain => chain.id === chainId);
      return chain?.name || 'Unknown';
    };

    const getChainImagePath = (chainId: string): string => {
      const chain = availableChains.find(chain => chain.id === chainId);
      return chain?.icon || '/chain/sonic.png'; // fallback to sonic
    };

    return (
      <SimpleAsset
        key={symbol}
        name={symbol}
        imageUrl={`/coin/${symbol.toLowerCase()}.png`}
        networkBadge={
          <SingleNetworkBadge
            networkImage={getChainImagePath(singleToken.xChainId)}
            isHovered={isHovered}
            tokenSymbol={symbol}
            chainName={getChainName(singleToken.xChainId)}
          />
        }
        onClick={() => handleSimpleAssetClick(singleToken)}
        {...commonProps}
      />
    );
  };

  return (
    <motion.div
      ref={assetsRef}
      layout
      className={`[flex-flow:wrap] box-border content-start flex gap-0 items-start justify-center px-0 py-4 relative shrink-0 w-full flex-1 ${
        isChainSelectorOpen ? 'blur filter opacity-30' : ''
      }`}
      data-name="Assets"
    >
      <AnimatePresence mode="popLayout">
        <ScrollArea className="h-71 !overflow-visible">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-y-4">{filteredTokenSymbols.map(renderTokenSymbol)}</div>
        </ScrollArea>
      </AnimatePresence>
    </motion.div>
  );
}

function Footer({ isUsdtClicked }: { isUsdtClicked: boolean }) {
  return (
    <div
      className={`box-border content-stretch flex flex-row gap-1.5 items-center justify-center p-0 relative shrink-0 transition-all duration-200 cursor-pointer ${
        isUsdtClicked ? 'blur filter opacity-30' : ''
      }`}
      data-name="Row"
    >
      <div className="flex flex-col font-['InterRegular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-espresso text-[16px] text-center text-nowrap">
        <p className="block leading-[1.4] whitespace-pre">Sorted by</p>
      </div>
      <div className="flex flex-col font-['InterRegular'] font-normal justify-center leading-[0] not-italic relative shrink-0 text-yellow-dark text-[0px] text-center text-nowrap">
        <p className="block font-['InterBold'] font-bold leading-[1.4] text-[16px] whitespace-pre">24h volume</p>
      </div>
      <ChevronUpIcon className="w-4 h-4 text-yellow-dark" />
    </div>
  );
}

function Container({
  onTokenSelect,
  onClose,
}: {
  onTokenSelect?: (token: XToken) => void;
  onClose: () => void;
}) {
  const [clickedAsset, setClickedAsset] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false);
  const [selectedChainFilter, setSelectedChainFilter] = useState<SpokeChainId | null>(null);

  const handleAssetClick = (e: React.MouseEvent, symbol: string) => {
    setClickedAsset(clickedAsset === symbol ? null : symbol);
  };

  const handleClickOutside = () => {
    setClickedAsset(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleChainSelectorClick = () => {
    setIsChainSelectorOpen(!isChainSelectorOpen);
  };

  const handleShowAllChains = () => {
    setSelectedChainFilter(null);
    setIsChainSelectorOpen(false);
  };

  const handleChainSelect = (chainId: string) => {
    setSelectedChainFilter(chainId as SpokeChainId);
    setIsChainSelectorOpen(false);
  };

  return (
    <>
      <SearchBar
        isUsdtClicked={clickedAsset !== null}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        handleChainSelectorClick={handleChainSelectorClick}
        isChainSelectorOpen={isChainSelectorOpen}
        handleShowAllChains={handleShowAllChains}
        handleChainSelect={handleChainSelect}
      />
      <Assets
        clickedAsset={clickedAsset}
        onAssetClick={handleAssetClick}
        onClickOutside={handleClickOutside}
        searchQuery={searchQuery}
        onTokenSelect={onTokenSelect}
        onClose={onClose}
        selectedChainFilter={selectedChainFilter}
        isChainSelectorOpen={isChainSelectorOpen}
      />
      <Footer isUsdtClicked={false} />
    </>
  );
}

export default function InteractiveModal({
  isOpen,
  onClose,
  onTokenSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect?: (token: XToken) => void;
}) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full md:max-w-[480px] shadow-none bg-white gap-4 p-12" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="relative">
            <DialogClose className="absolute -top-4 right-0" asChild>
              <button
                type="button"
                className="w-12 h-12 flex items-center justify-center cursor-pointer text-clay-light hover:text-clay rounded-full transition-colors"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </DialogClose>
          </DialogTitle>
        </DialogHeader>
        <Container onTokenSelect={onTokenSelect} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}

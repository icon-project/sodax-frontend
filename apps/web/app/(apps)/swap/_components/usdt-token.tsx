import { motion } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { useState } from 'react';

const availableChains = [
  { id: 'chain1', name: 'Sonic', icon: '/chain/sonic.png' },
  { id: 'chain2', name: 'Avalanche', icon: '/chain/0xa86a.avax.png' },
  { id: 'chain3', name: 'Arbitrum', icon: '/chain/0xa4b1.arbitrum.png' },
  { id: 'chain4', name: 'Base', icon: '/chain/0x2105.base.png' },
  { id: 'chain5', name: 'BSC', icon: '/chain/0x38.bsc.png' },
  { id: 'chain6', name: 'Injective', icon: '/chain/injective-1.png' },
  { id: 'chain7', name: 'Sui', icon: '/chain/sui.png' },
  { id: 'chain8', name: 'Optimism', icon: '/chain/0xa.optimism.png' },
  { id: 'chain9', name: 'Polygon', icon: '/chain/0x89.polygon.png' },
  { id: 'chain10', name: 'Solana', icon: '/chain/solana.png' },
  { id: 'chain11', name: 'Stellar', icon: '/chain/stellar.png' },
  { id: 'chain12', name: 'Icon', icon: '/chain/0x1.icon.png' },
  { id: 'chain13', name: 'Nibiru', icon: '/chain/nibiru.png' },
];

function CounterBadge({ count, isHovered }: { count: string; isHovered?: boolean }) {
  return (
    <div
      className="absolute bg-[#ffffff] bottom-[4.17%] box-border content-stretch flex flex-col items-center justify-center p-0 rounded top-[62.5%] translate-x-[-50%] w-4 transition-transform duration-200"
      data-name="Networks medium"
      style={{
        left: 'calc(50% + 14px)',
        transform: `translateX(-50%) ${isHovered ? 'scale(1.2)' : 'scale(1)'}`,
      }}
    >
      <div
        aria-hidden="true"
        className="absolute border-2 border-[#ffffff] border-solid inset-[-2px] pointer-events-none rounded-md shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.1)]"
      />
      <div
        className="absolute bg-[#ffffff] h-4 left-1 mix-blend-multiply rounded top-0 w-3"
        data-name="Networks medium/Variant8"
      >
        <div
          aria-hidden="true"
          className="absolute border-2 border-[#ffffff] border-solid inset-[-2px] pointer-events-none rounded-md shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.1)]"
        />
      </div>
      <div
        className="absolute box-border content-stretch flex flex-row items-center justify-start p-0 top-[3px] translate-x-[-50%]"
        data-name="Counter"
        style={{ left: 'calc(50% + 2px)' }}
      >
        <div
          className={`font-['Inter:Medium',_sans-serif] leading-[0] not-italic relative shrink-0 text-[#483534] text-[8px] text-left text-nowrap transition-all duration-200 ${
            isHovered ? 'font-bold' : 'font-medium'
          }`}
        >
          <p className="block leading-[1.2] whitespace-pre">{count}</p>
        </div>
      </div>
    </div>
  );
}

function AssetsImg3() {
  return (
    <div
      className="bg-no-repeat bg-size-[100%_100%] bg-top-left rounded-[256px] shrink-0 size-6"
      data-name="Assets IMG"
      style={{ backgroundImage: `url('/coin/usdt.png')` }}
    />
  );
}

function AssetsBig3() {
  return (
    <div
      className="absolute bg-[#ffffff] bottom-1/4 box-border content-stretch flex flex-col items-start justify-start left-1/2 overflow-clip p-0 rounded-[256px] top-1/4 translate-x-[-50%]"
      data-name="Assets big"
    >
      <AssetsImg3 />
    </div>
  );
}

function FullAssetBig3({ isClicked, isHovered }: { isClicked: boolean; isHovered?: boolean }) {
  return (
    <div
      className="relative shrink-0 size-12 transition-all duration-200 ease-out"
      data-name="Full asset big"
      style={{
        transform: isClicked ? 'translateY(-8px)' : 'translateY(0px)',
      }}
    >
      <div className="absolute inset-0 rounded-[80px] shadow-[0px_8px_20px_0px_rgba(175,145,145,0.2)]" />
      <AssetsBig3 />
      <div className="transition-opacity duration-200" style={{ opacity: isClicked ? 0 : 1 }}>
        <CounterBadge count="7" isHovered={isHovered} />
      </div>
    </div>
  );
}

function UsdtAsset({
  isClicked,
  onClick,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}: {
  isClicked: boolean;
  onClick: (e: React.MouseEvent) => void;
  isHovered: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState(false);

  const handleChainSelectorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsChainSelectorOpen(!isChainSelectorOpen);
  };

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
      className="box-border content-stretch flex flex-col gap-2 items-center justify-start p-4 relative shrink-0 cursor-pointer"
      data-name="Asset"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <FullAssetBig3 isClicked={isClicked} isHovered={isHovered} />
      <div className="relative h-6 w-full">
        <div
          className={`font-['Inter:Medium',_sans-serif] leading-[0] not-italic absolute inset-0 flex items-center justify-center text-[12px] transition-all duration-200 ${
            isClicked
              ? 'opacity-0'
              : isHovered
                ? 'opacity-100 text-[#483534] font-bold'
                : 'opacity-100 text-[#8e7e7d] font-medium'
          }`}
        >
          <p className="block leading-[1.4] whitespace-pre">USDT</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center" style={{ top: '26px' }}>
          {/* Chain selector trigger */}
          <div className="flex justify-start items-center gap-2 cursor-pointer" onClick={handleChainSelectorClick}>
            <div className="w-6 h-6 rounded-sm shadow-[-4px_0px_10px_0px_rgba(175,145,145,0.04)] flex justify-center items-center gap-1 flex-wrap content-center overflow-hidden">
              {/* Show first 4 chain icons */}
              {availableChains.slice(0, 4).map((chain, index) => (
                <img key={index} src={chain.icon} alt={chain.name} className="w-3 h-3 rounded-[2px]" />
              ))}
            </div>
            {isChainSelectorOpen ? (
              <ChevronUpIcon className="w-4 h-4 text-[#ECC100]" />
            ) : (
              <ChevronDownIcon className="w-4 h-4 text-[#ECC100]" />
            )}
          </div>
          {/* Chain selector dropdown */}
          {isChainSelectorOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 mb-2 px-2">Available Chains</div>
                {availableChains.map(chain => (
                  <div
                    key={chain.id}
                    className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                    onClick={() => {
                      // Handle chain selection (e.g., update UI)
                      setIsChainSelectorOpen(false);
                    }}
                  >
                    <img src={chain.icon} alt={chain.name} className="w-4 h-4 rounded-sm" />
                    <span className="text-sm text-gray-700">{chain.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default UsdtAsset;

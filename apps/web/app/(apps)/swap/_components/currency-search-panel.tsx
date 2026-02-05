import type React from 'react';
import Image from 'next/image';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { availableChains, getChainIcon } from '@/constants/chains';
import { useState } from 'react';
import { AllNetworkIcon } from '@/components/shared/all-network-icon';

interface CurrencySearchPanelProps {
  isUsdtClicked: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  handleChainSelectorClick: () => void;
  isChainSelectorOpen: boolean;
  handleShowAllChains: () => void;
  handleChainSelect: (chainId: string) => void;
  selectedChainId?: string | null;
}

export function CurrencySearchPanel({
  isUsdtClicked,
  searchQuery,
  onSearchChange,
  handleChainSelectorClick,
  isChainSelectorOpen,
  handleShowAllChains,
  handleChainSelect,
  selectedChainId,
}: CurrencySearchPanelProps): React.JSX.Element {
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);

  return (
    <div
      className={`mt-4 box-border content-stretch flex flex-col gap-2 items-center justify-start p-0 relative shrink-0 transition-all duration-200 h-12 ${
        isUsdtClicked ? 'blur filter opacity-30' : ''
      }`}
    >
      <div className="w-full flex justify-center">
        <div
          className={`w-60 sm:w-64 h-12 px-6 rounded-[32px] outline-4 outline-offset-[-4px] outline-cream-white inline-flex justify-between items-center transition-all duration-200
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
                autoFocus
                type="text"
                placeholder={isChainSelectorOpen ? 'Select a network' : 'Search assets...'}
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                readOnly={isChainSelectorOpen}
                className="placeholder:!text-clay-light text-(length:--body-super-comfortable) p-2 border-none focus:border-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none focus-visible:border-none focus-visible:ring-0 text-espresso focus-visible:text-espresso"
              />
            </div>
          </div>
          <div className="relative">
            <div
              className="flex justify-start items-center gap-2 cursor-pointer z-51"
              onClick={handleChainSelectorClick}
            >
              {selectedChainId ? (
                <div className="w-8 h-8 flex justify-center items-center relative group">
                  <Image
                    src={getChainIcon(selectedChainId) || '/chain/0x2105.base.png'}
                    alt="Selected Chain"
                    width={24}
                    height={24}
                    className="rounded-[6px] shadow-[-4px_0px_4px_0px_rgba(175,145,145,1)] ring-4 ring-white overflow-hidden"
                    priority
                  />
                </div>
              ) : (
                <div className="w-6 h-6 grid grid-cols-2 gap-1 p-[2px]">
                  <AllNetworkIcon />
                </div>
              )}
              {isChainSelectorOpen ? (
                <ChevronUpIcon className="w-4 h-4 text-clay transition-transform duration-200" />
              ) : (
                <ChevronDownIcon className="w-4 h-4 text-espresso transition-transform duration-200" />
              )}
            </div>

            {isChainSelectorOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50 mt-36">
                <div className="absolute inset-0 bg-transparent" onClick={handleChainSelectorClick} />
                <div className="relative bg-transparent border-none">
                  <div className="grid grid-cols-2 overflow-hidden p-2 gap-x-4">
                    <div
                      className={`group inline-flex justify-start items-center gap-4 py-2 cursor-pointer ${hoveredChain !== null && (hoveredChain === 'all' ? 'opacity-100' : 'opacity-60')}`}
                      onClick={handleShowAllChains}
                      onMouseEnter={() => setHoveredChain('all')}
                      onMouseLeave={() => setHoveredChain(null)}
                    >
                      <div className="w-6 h-6  ring-4 ring-white rounded-[6px] shadow-[-4px_0px_4px_rgba(175,145,145,1)] flex justify-center items-center gap-1 flex-wrap content-center overflow-hidden bg-cream-white">
                        <AllNetworkIcon />
                      </div>
                      <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight group-hover:font-bold">
                        All
                      </div>
                    </div>

                    {availableChains.map(chain => (
                      <div
                        key={chain.id}
                        className={`group inline-flex justify-start items-center gap-4 py-2 cursor-pointer ${hoveredChain !== null && (hoveredChain === chain.id ? 'opacity-100' : 'opacity-60')}`}
                        onClick={() => handleChainSelect(chain.id)}
                        onMouseEnter={() => setHoveredChain(chain.id)}
                        onMouseLeave={() => setHoveredChain(null)}
                      >
                        <Image
                          src={chain.icon}
                          alt={chain.name}
                          width={24}
                          height={24}
                          className="rounded-[6px] ring-4 ring-white shadow-[-4px_0px_4px_0px_rgba(175,145,145,1)]"
                          priority
                        />
                        <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight group-hover:font-bold">
                          {chain.name}
                        </div>
                      </div>
                    ))}
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

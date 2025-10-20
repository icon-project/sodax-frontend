import type React from 'react';
import Image from 'next/image';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { availableChains, getChainIcon } from '@/constants/chains';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CloseIcon1 } from '@/components/icons/close-icon1';

interface SearchBarProps {
  isUsdtClicked: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  handleChainSelectorClick: () => void;
  isChainSelectorOpen: boolean;
  handleShowAllChains: () => void;
  handleChainSelect: (chainId: string) => void;
  selectedChainId?: string | null;
}

export function SearchBar({
  isUsdtClicked,
  searchQuery,
  onSearchChange,
  handleChainSelectorClick,
  isChainSelectorOpen,
  handleShowAllChains,
  handleChainSelect,
  selectedChainId,
}: SearchBarProps): React.JSX.Element {
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  return (
    <div
      className={`mt-4 box-border content-stretch flex flex-col gap-2 items-center justify-start p-0 relative shrink-0 transition-all duration-200 ${
        isUsdtClicked ? 'blur filter opacity-30' : ''
      }`}
    >
      <div className="w-full flex justify-center">
        <div
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
                autoFocus
                type="text"
                placeholder={isChainSelectorOpen ? 'Select a network' : 'Search assets...'}
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                readOnly={isChainSelectorOpen}
                className="text-(length:--body-super-comfortable) p-2 border-none focus:border-none shadow-none focus:outline-none focus:ring-0 focus:shadow-none focus-visible:border-none focus-visible:ring-0 text-espresso focus-visible:text-espresso"
              />
            </div>
          </div>
          <div className="relative">
            <div
              className="flex justify-start items-center gap-2 cursor-pointer z-51"
              onClick={selectedChainId && !isChainSelectorOpen ? () => handleChainSelect('') : handleChainSelectorClick}
            >
              {selectedChainId ? (
                <div className="w-8 h-8 flex justify-center items-center relative group">
                  {!isChainSelectorOpen && (
                    <Button
                      className="w-4 h-4 bg-white rounded-[256px] absolute !p-0 -left-2 top-2 z-52 hover:!bg-white"
                      variant="cream"
                      onClick={e => {
                        e.stopPropagation();
                        handleChainSelect('');
                      }}
                    >
                      <CloseIcon1 className="text-clay group-hover:text-espresso transition-colors" />
                    </Button>
                  )}
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
                  <Image
                    src="/chain/0x2105.base.png"
                    alt="Base"
                    width={8}
                    height={8}
                    className="rounded-[2px]"
                    priority
                  />
                  <Image src="/chain/solana.png" alt="Solana" width={8} height={8} className="rounded-[2px]" priority />
                  <Image
                    src="/chain/0xa4b1.arbitrum.png"
                    alt="Arbitrum"
                    width={8}
                    height={8}
                    className="rounded-[2px]"
                    priority
                  />
                  <Image src="/chain/sui.png" alt="Sui" width={8} height={8} className="rounded-[2px]" priority />
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
                <div className="relative bg-transparent border-none w-64">
                  <div className="grid grid-cols-2 overflow-hidden pl-2 py-1">
                    {/* All Networks Option */}
                    <div
                      className={`w-34 group inline-flex justify-start items-center gap-4 pb-4 cursor-pointer ${hoveredChain !== null && (hoveredChain === 'all' ? 'opacity-100' : 'opacity-60')}`}
                      onClick={handleShowAllChains}
                      onMouseEnter={() => setHoveredChain('all')}
                      onMouseLeave={() => setHoveredChain(null)}
                    >
                      <div className="w-6 h-6  ring-4 ring-white rounded-[6px] shadow-[-4px_0px_4px_0px_rgba(175,145,145,1)] flex justify-center items-center gap-1 flex-wrap content-center overflow-hidden">
                        <>
                          <Image
                            src="/chain/0x2105.base.png"
                            alt="Base"
                            width={8}
                            height={8}
                            className="rounded-[2px]"
                            priority
                          />
                          <Image
                            src="/chain/solana.png"
                            alt="Solana"
                            width={8}
                            height={8}
                            className="rounded-[2px]"
                            priority
                          />
                          <Image
                            src="/chain/0xa4b1.arbitrum.png"
                            alt="Arbitrum"
                            width={8}
                            height={8}
                            className="rounded-[2px]"
                            priority
                          />
                          <Image
                            src="/chain/sui.png"
                            alt="Sui"
                            width={8}
                            height={8}
                            className="rounded-[2px]"
                            priority
                          />
                        </>
                      </div>
                      <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight group-hover:font-bold">
                        All
                      </div>
                    </div>

                    {availableChains.map(chain => (
                      <div
                        key={chain.id}
                        className={`w-34 group inline-flex justify-start items-center gap-4 pb-4 cursor-pointer ${hoveredChain !== null && (hoveredChain === chain.id ? 'opacity-100' : 'opacity-60')}`}
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

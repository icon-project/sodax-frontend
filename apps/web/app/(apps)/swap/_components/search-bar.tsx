// apps/web/app/(apps)/swap/_components/search-bar.tsx
import type React from 'react';
import Image from 'next/image';
import { ChevronDownIcon, ChevronUpIcon, SearchIcon, LayoutGrid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { availableChains, getChainIcon } from '@/constants/chains';

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
  return (
    <div
      className={`box-border content-stretch flex flex-col gap-2 items-center justify-start p-0 relative shrink-0 transition-all duration-200 mt-4 ${
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
                className="w-6 h-6 rounded-sm shadow-[-4px_0px_10px_0px_rgba(175,145,145,0.2)] flex justify-center items-center gap-1 flex-wrap content-center overflow-hidden"
              >
                {selectedChainId ? (
                  <div
                    data-property-1="Default"
                    className="rounded-[6px] shadow-[-4px_0px_4px_rgba(175,145,145,0.1)] border border-4 border-white inline-flex flex-col justify-center items-center overflow-hidden"
                  >
                    <Image
                      src={getChainIcon(selectedChainId) || '/chain/0x2105.base.png'}
                      alt="Selected Chain"
                      width={24}
                      height={24}
                      className="rounded-[2px]"
                    />
                  </div>
                ) : (
                  <>
                    <Image src="/chain/0x2105.base.png" alt="Base" width={8} height={8} className="rounded-[2px]" />
                    <Image src="/chain/solana.png" alt="Solana" width={8} height={8} className="rounded-[2px]" />
                    <Image
                      src="/chain/0xa4b1.arbitrum.png"
                      alt="Arbitrum"
                      width={8}
                      height={8}
                      className="rounded-[2px]"
                    />
                    <Image src="/chain/sui.png" alt="Sui" width={8} height={8} className="rounded-[2px]" />
                  </>
                )}
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
                <div className="relative bg-transparent border-none w-64">
                  <div className="mt-26">
                    <div className="grid grid-cols-2 gap-2 overflow-hidden pl-4">
                      {/* All Networks Option */}
                      <div
                        className="w-34 inline-flex justify-start items-center gap-3 cursor-pointer"
                        onClick={handleShowAllChains}
                      >
                        <div className="w-8 h-8 border border-4 border-white rounded-sm shadow-[-4px_0px_10px_0px_rgba(175,145,145,0.2)] flex justify-center items-center gap-1 flex-wrap content-center overflow-hidden">
                          <>
                            <Image
                              src="/chain/0x2105.base.png"
                              alt="Base"
                              width={8}
                              height={8}
                              className="rounded-[2px]"
                            />
                            <Image
                              src="/chain/solana.png"
                              alt="Solana"
                              width={8}
                              height={8}
                              className="rounded-[2px]"
                            />
                            <Image
                              src="/chain/0xa4b1.arbitrum.png"
                              alt="Arbitrum"
                              width={8}
                              height={8}
                              className="rounded-[2px]"
                            />
                            <Image src="/chain/sui.png" alt="Sui" width={8} height={8} className="rounded-[2px]" />
                          </>
                        </div>
                        <div className="flex justify-start items-center gap-1">
                          <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight">
                            All chains
                          </div>
                        </div>
                      </div>

                      {availableChains.map(chain => (
                        <div
                          key={chain.id}
                          className="w-34 inline-flex justify-start items-center gap-3 cursor-pointer"
                          onClick={() => handleChainSelect(chain.id)}
                        >
                          <div className="border border-4 border-white rounded-[6px] shadow-[-4px_0px_4px_rgba(175,145,145,0.1)]">
                            <Image src={chain.icon} alt={chain.name} width={24} height={24} className="rounded-[6px]" />
                          </div>
                          <div className="flex justify-start items-center gap-1">
                            <div className="justify-center text-espresso text-(length:--body-comfortable) font-medium font-['InterRegular'] leading-tight">
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

import type React from 'react';
import { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import TokenGroupLogo from './token-group-logo';
import TokenChainSelector from '@/components/shared/token-chain-selector';
import { ChevronDownIcon, ChevronUpIcon, Search, SearchIcon, XIcon } from 'lucide-react';
import { getAllSupportedSolverTokens } from '@/lib/utils';
import { getUniqueTokenSymbols } from '@/lib/token-utils';
import { type XToken, type SpokeChainId, SPOKE_CHAIN_IDS } from '@sodax/types';
import Image from 'next/image';
import { Button } from 'react-scroll';

// Available chains data
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

interface TokenSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect: (token: XToken) => void;
  chainId: SpokeChainId;
  selectedToken?: XToken;
}

const TokenSelectorDialog: React.FC<TokenSelectorDialogProps> = ({
  isOpen,
  onClose,
  onTokenSelect,
  chainId,
  selectedToken,
}: TokenSelectorDialogProps) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isChainSelectorOpen, setIsChainSelectorOpen] = useState<boolean>(false);
  const [selectedChainFilter, setSelectedChainFilter] = useState<SpokeChainId | 'all'>('all');
  const [chainSelectorOpen, setChainSelectorOpen] = useState<boolean>(false);
  const [selectedTokensForChain, setSelectedTokensForChain] = useState<{ symbol: string; tokens: XToken[] } | null>(
    null,
  );

  const allSupportedTokens = getAllSupportedSolverTokens();
  console.log('allSuppotedToken', allSupportedTokens);
  const uniqueTokenSymbols = getUniqueTokenSymbols(allSupportedTokens);

  const filteredTokenSymbols = uniqueTokenSymbols.filter(({ symbol, tokens }) => {
    const matchesSearch =
      symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tokens.some(token => token.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesChain = selectedChainFilter === 'all' || tokens.some(token => token.xChainId === selectedChainFilter);

    return matchesSearch && matchesChain;
  });

  const handleTokenClick = (tokenSymbol: string, tokens: XToken[]): void => {
    // Ensure we have tokens to work with
    if (tokens.length === 0) {
      return;
    }

    const firstToken = tokens[0];
    if (!firstToken) {
      return;
    }

    // If there's only one token for this symbol, select it directly
    if (tokens.length === 1) {
      onTokenSelect(firstToken);
      onClose();
      setSearchQuery('');
      setSelectedChainFilter('all');
      return;
    }

    // If there are multiple tokens, show the chain selector
    setSelectedTokensForChain({ symbol: tokenSymbol, tokens });
    setChainSelectorOpen(true);
  };

  const handleChainTokenSelect = (token: XToken): void => {
    onTokenSelect(token);
    setChainSelectorOpen(false);
    setSelectedTokensForChain(null);
    onClose();
    setSearchQuery('');
    setSelectedChainFilter('all');
  };

  const handleChainSelectorClick = (): void => {
    setIsChainSelectorOpen(!isChainSelectorOpen);
  };

  const handleChainSelect = (chainId: string): void => {
    console.log('chainId', chainId);
    setSelectedChainFilter(chainId as SpokeChainId);
    setIsChainSelectorOpen(false);
  };

  const handleShowAllChains = (): void => {
    setSelectedChainFilter('all');
    setIsChainSelectorOpen(false);
  };

  const getChainInfo = (chainId: SpokeChainId) => {
    return availableChains.find(chain => chain.id === chainId);
  };

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
        <div className="relative"></div>

        <div className="w-full flex justify-center">
          <div
            data-property-1="Default"
            className="w-64 h-12 px-6 rounded-[32px] outline outline-4 outline-offset-[-4px] outline-cream-white inline-flex justify-between items-center"
          >
            <div className="flex items-center">
              <SearchIcon className="w-4 h-4 text-clay" />
              <div className="flex justify-start items-center">
                <Input
                  type="text"
                  placeholder="Search tokens..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
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
                  <Image
                    src="/chain/0xa4b1.arbitrum.png"
                    alt="Arbitrum"
                    width={8}
                    height={8}
                    className="rounded-[2px]"
                  />
                  <Image src="/chain/sui.png" alt="Sui" width={8} height={8} className="rounded-[2px]" />
                </div>
                {isChainSelectorOpen ? (
                  <ChevronUpIcon className="w-4 h-4 text-clay transition-transform duration-200" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-clay transition-transform duration-200" />
                )}
              </div>

              {isChainSelectorOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <div className="text-xs font-medium text-gray-500 mb-2 px-2">Filter by Chain</div>
                    <div
                      className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                      onClick={handleShowAllChains}
                    >
                      <div className="w-4 h-4 flex items-center justify-center">
                        <span className="text-xs">🌐</span>
                      </div>
                      <span className="text-sm text-gray-700">All Chains</span>
                    </div>
                    {availableChains.map(chain => (
                      <div
                        key={chain.id}
                        className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                        onClick={() => handleChainSelect(chain.id)}
                      >
                        <Image src={chain.icon} alt={chain.name} width={16} height={16} className="rounded-sm" />
                        <span className="text-sm text-gray-700">{chain.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <ScrollArea className="h-71">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-y-4">
            {filteredTokenSymbols
              .filter(({ tokens }) => tokens.length > 0) // Only show groups with tokens
              .map(({ symbol, tokens }) => {
                const isSelected = tokens.some(
                  token => selectedToken?.address === token.address && selectedToken?.xChainId === token.xChainId,
                );

                return (
                  <div
                    key={symbol}
                    className={`flex flex-col items-center gap-2 px-4 rounded-lg cursor-pointer transition-colors text-clay hover:text-espresso hover:scale-110 transition-all duration-200 ${
                      isSelected ? 'text-espresso' : ''
                    }`}
                    onClick={() => handleTokenClick(symbol, tokens)}
                  >
                    <div className="relative">
                      <TokenGroupLogo tokens={tokens} symbol={symbol} />
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <span className="text-(length:--body-small) font-medium font-['InterRegular'] text-sm">
                        {symbol}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </ScrollArea>

        <div className="w-full justify-center flex">
          <button
            type="button"
            className="w-34 h-11 bg-transparent text-espresso text-(length:--body-super-comfortable) cursor-pointer font-normal hover:font-bold"
          >
            View all assets
          </button>
        </div>
      </DialogContent>

      {/* Chain Selector Dialog */}
      {selectedTokensForChain && (
        <TokenChainSelector
          isOpen={chainSelectorOpen}
          onClose={() => {
            setChainSelectorOpen(false);
            setSelectedTokensForChain(null);
          }}
          onTokenSelect={handleChainTokenSelect}
          tokens={selectedTokensForChain.tokens}
          symbol={selectedTokensForChain.symbol}
        />
      )}
    </Dialog>
  );
};

export default TokenSelectorDialog;

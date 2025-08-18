// apps/web/components/shared/token-chain-selector.tsx
import type React from 'react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import CurrencyLogo from '@/components/shared/currency-logo';
import type { XToken } from '@sodax/types';
import Image from 'next/image';
import { XIcon } from 'lucide-react';

interface TokenChainSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSelect: (token: XToken) => void;
  tokens: XToken[];
  symbol: string;
}

// Available chains data (same as in token-selector-dialog)
const availableChains = [
  { id: '0x1.sonic', name: 'Sonic', icon: '/chain/sonic.png' },
  { id: '0xa86a.avax', name: 'Avalanche', icon: '/chain/0xa86a.avax.png' },
  { id: '0xa4b1.arbitrum', name: 'Arbitrum', icon: '/chain/0xa4b1.arbitrum.png' },
  { id: '0x2105.base', name: 'Base', icon: '/chain/0x2105.base.png' },
  { id: '0x38.bsc', name: 'BSC', icon: '/chain/0x38.bsc.png' },
  { id: 'injective-1', name: 'Injective', icon: '/chain/injective-1.png' },
  { id: 'sui', name: 'Sui', icon: '/chain/sui.png' },
  { id: '0xa.optimism', name: 'Optimism', icon: '/chain/0xa.optimism.png' },
  { id: '0x89.polygon', name: 'Polygon', icon: '/chain/0x89.polygon.png' },
  { id: 'solana', name: 'Solana', icon: '/chain/solana.png' },
  { id: 'stellar', name: 'Stellar', icon: '/chain/stellar.png' },
  { id: '0x1.icon', name: 'Icon', icon: '/chain/0x1.icon.png' },
  { id: 'nibiru', name: 'Nibiru', icon: '/chain/nibiru.png' },
];

const TokenChainSelector: React.FC<TokenChainSelectorProps> = ({
  isOpen,
  onClose,
  onTokenSelect,
  tokens,
  symbol,
}: TokenChainSelectorProps) => {
  const getChainInfo = (chainId: string) => {
    return availableChains.find(chain => chain.id === chainId);
  };

  const handleTokenSelect = (token: XToken): void => {
    onTokenSelect(token);
    onClose();
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

        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-espresso mb-2">Select {symbol} Network</h3>
          <p className="text-sm text-clay-light">Choose which network you want to use for {symbol}</p>
        </div>

        <ScrollArea className="h-96">
          <div className="space-y-3">
            {tokens.map(token => {
              const chainInfo = getChainInfo(token.xChainId);

              return (
                <div
                  key={`${token.xChainId}-${token.address}`}
                  className="flex items-center gap-4 p-4 rounded-lg cursor-pointer transition-colors text-clay hover:text-espresso hover:bg-gray-50"
                  onClick={() => handleTokenSelect(token)}
                >
                  <div className="flex items-center gap-3">
                    <CurrencyLogo currency={token} className="w-10 h-8" />
                    <div className="flex items-center gap-2">
                      {chainInfo && (
                        <Image
                          src={chainInfo.icon}
                          alt={chainInfo.name}
                          width={20}
                          height={20}
                          className="rounded-sm"
                        />
                      )}
                      <span className="font-medium">{chainInfo?.name || token.xChainId}</span>
                    </div>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-sm font-medium">{token.name}</div>
                    <div className="text-xs text-clay-light">
                      {token.address.slice(0, 8)}...{token.address.slice(-6)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default TokenChainSelector;

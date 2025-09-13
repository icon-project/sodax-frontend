// apps/web/components/shared/token-chain-selector.tsx
import type React from 'react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import CurrencyLogo from './currency-logo';
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

import { availableChains } from '@/constants/chains';

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

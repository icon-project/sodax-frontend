import type React from 'react';
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { XToken, SpokeChainId } from '@sodax/types';
import Image from 'next/image';
import { XIcon } from 'lucide-react';
import {
  bnUSDLegacySpokeChainIds,
  newbnUSDSpokeChainIds,
  spokeChainConfig,
  isLegacybnUSDToken,
  isNewbnUSDToken,
  getAllLegacybnUSDTokens,
  type LegacybnUSDChainId,
  type NewbnUSDChainId,
  HYPEREVM_MAINNET_CHAIN_ID,
  NIBIRU_MAINNET_CHAIN_ID,
} from '@sodax/sdk';
import { availableChains } from '@/constants/chains';
import { Separator } from '@/components/ui/separator';

interface BnUSDChainSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onChainSelect: (chainId: SpokeChainId, token: XToken) => void;
  currency: XToken;
  type: string;
}

const BnUSDChainSelector: React.FC<BnUSDChainSelectorProps> = ({
  isOpen,
  onClose,
  onChainSelect,
  currency,
  type,
}: BnUSDChainSelectorProps) => {
  const getChainInfo = (chainId: string) => {
    return availableChains.find(chain => chain.id === chainId);
  };

  const handleChainSelect = (chainId: SpokeChainId, token: XToken): void => {
    onChainSelect(chainId, token);
    onClose();
  };

  // Determine if this is legacy or new bnUSD
  const isLegacy = isLegacybnUSDToken(currency);
  const isNew = isNewbnUSDToken(currency);

  // Get available chains and tokens based on currency type
  const getAvailableChainsAndTokens = (): { chainId: SpokeChainId; token: XToken; chainName: string }[] => {
    if (isLegacy) {
      // For legacy bnUSD, show all legacy chains
      return bnUSDLegacySpokeChainIds.map(chainId => {
        const config = spokeChainConfig[chainId as LegacybnUSDChainId];
        const token = config.supportedTokens.legacybnUSD || config.supportedTokens.bnUSD;
        return {
          chainId,
          token,
          chainName: config.chain.name,
        };
      });
    }
    if (isNew) {
      // For new bnUSD, show all new bnUSD chains except Nibiru
      return newbnUSDSpokeChainIds
        .filter(chainId => chainId !== NIBIRU_MAINNET_CHAIN_ID && chainId !== HYPEREVM_MAINNET_CHAIN_ID)
        .map(chainId => {
          const config = spokeChainConfig[chainId as NewbnUSDChainId];
          const token = config.supportedTokens.bnUSD;
          return {
            chainId,
            token,
            chainName: config.chain.name,
          };
        });
    }
    return [];
  };

  const availableChainsAndTokens = getAvailableChainsAndTokens();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-full md:max-w-[480px] shadow-none bg-vibrant-white gap-4 p-12 min-h-60 block"
        hideCloseButton
      >
        {/* <DialogHeader> */}
        {/* <div className="flex flex-row justify-between items-center w-full"> */}
        <div className="inline-flex justify-start items-center w-full h-6 gap-2 mb-4">
          <Image src="/symbol_dark.png" alt="SODAX Symbol" width={16} height={16} className="mix-blend-multiply" />
          <DialogTitle className="mix-blend-multiply text-espresso font-['InterBold'] leading-snug text-(size:--body-super-comfortable) flex justify-between items-center w-full">
            {type === 'INPUT' ? 'Migrate from' : 'Migrate to'}
            <DialogClose asChild>
              <XIcon className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay" />
            </DialogClose>
          </DialogTitle>
        </div>
        {/* </div> */}
        {/* </DialogHeader> */}
        <Separator className="h-1 bg-clay opacity-30 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4">
          {availableChainsAndTokens.map(({ chainId, token, chainName }) => {
            const chainInfo = getChainInfo(chainId);

            return (
              <div
                className="w-24 inline-flex justify-start items-center gap-4 cursor-pointer"
                key={`${chainId}-${token.address}`}
                onClick={() => handleChainSelect(chainId, token)}
              >
                <div
                  data-property-1="Default"
                  className="rounded-[6px] shadow-[-4px_0px_4px_rgba(175,145,145,1)] outline outline-4 outline-white inline-flex flex-col justify-center items-center overflow-hidden"
                >
                  <Image
                    src={chainInfo?.icon || ''}
                    alt={chainInfo?.name || ''}
                    width={24}
                    height={24}
                    className="rounded-[6px]"
                  />
                </div>
                <div className="flex justify-start items-center gap-1">
                  <div className="justify-center text-espresso text-xs font-medium font-['InterRegular'] leading-tight">
                    {chainName}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BnUSDChainSelector;

import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupButton,
} from '@/components/ui/input-group';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { DialogContent, Dialog, DialogTitle } from '@/components/ui/dialog';
import { AllNetworkIcon } from '@/components/shared/all-network-icon';
import { availableChains as allAvailableChains, getChainIcon } from '@/constants/chains';
import Image from 'next/image';
import { ICON_MAINNET_CHAIN_ID, INJECTIVE_MAINNET_CHAIN_ID, LIGHTLINK_MAINNET_CHAIN_ID } from '@sodax/sdk';

export const CURRENCY_TABS = {
  STABLECOINS: 'stablecoins',
  ASSETS: 'assets',
  TOP_APY: 'top-apy',
} as const;

interface CurrencySearchPanelProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  activeTab: string;
  onTabChange: (value: string) => void;
  selectedChain: string | null;
  setSelectedChain: (chainId: string) => void;
}

export default function CurrencySearchPanel({
  searchQuery,
  onSearchChange,
  activeTab,
  onTabChange,
  selectedChain,
  setSelectedChain,
}: CurrencySearchPanelProps) {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const availableChains = allAvailableChains.filter(
    chain =>
      chain.id !== INJECTIVE_MAINNET_CHAIN_ID &&
      chain.id !== LIGHTLINK_MAINNET_CHAIN_ID &&
      chain.id !== ICON_MAINNET_CHAIN_ID,
  );
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const handleChainSelect = (chainId: string) => {
    setSelectedChain(chainId);
    setOpenDialog(false);
  };
  return (
    <>
      <motion.div
        className="w-full gap-(--layout-space-small) flex"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <InputGroup
          className={cn('rounded-full w-full md:w-44 h-10 border-none shadow-none mix-blend-multiply bg-almost-white')}
        >
          <InputGroupAddon>
            <InputGroupText className="cursor-pointer" onClick={() => onSearchChange('')}>
              {isInputFocused && searchQuery !== '' ? (
                <XIcon className="w-4 h-4 text-espresso" />
              ) : (
                <SearchIcon
                  className={cn(
                    'w-4 h-4 text-clay-light',
                    isInputFocused ? 'text-espresso' : isHovered ? 'text-clay' : 'text-clay-light',
                  )}
                />
              )}
            </InputGroupText>
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search"
            className="placeholder:text-clay-light font-['InterRegular'] !text-espresso"
            onChange={e => onSearchChange(e.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            value={searchQuery}
          />
          <InputGroupAddon align="inline-end">
            <InputGroupButton className="outline-none gap-1" onClick={() => setOpenDialog(true)}>
              {selectedChain ? (
                <Image
                  src={getChainIcon(selectedChain) || '/chain/0x2105.base.png'}
                  className="rounded-[6px] ring-4 ring-white shadow-[-4px_0px_4px_0px_rgba(175,145,145,1)]"
                  alt={selectedChain}
                  width={24}
                  height={24}
                />
              ) : (
                <div className="w-6 h-6 grid grid-cols-2 gap-1 p-[2px]">
                  <AllNetworkIcon />
                </div>
              )}
              <ChevronDownIcon
                className={cn(
                  'w-4 h-4 text-clay-light',
                  isInputFocused ? 'text-espresso' : isHovered ? 'text-clay' : 'text-clay-light',
                )}
              />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <Tabs value={activeTab} className="hidden md:block ">
          <TabsList className="bg-transparent text-clay-light text-(length:--body-comfortable) p-0 gap-(--layout-space-small)">
            <TabsTrigger
              value={CURRENCY_TABS.STABLECOINS}
              className="data-[state=active]:bg-cherry data-[state=active]:shadow-none cursor-pointer p-0"
              onClick={() => onTabChange(CURRENCY_TABS.STABLECOINS)}
            >
              <Badge
                variant="vibrant"
                className={cn(
                  'mix-blend-multiply text-[9px]',
                  isInputFocused || isHovered ? 'bg-cream-white text-espresso font-bold' : 'bg-vibrant-white',
                  activeTab === CURRENCY_TABS.STABLECOINS ? 'bg-cherry-bright' : '',
                )}
              >
                {activeTab === CURRENCY_TABS.STABLECOINS ? <XIcon className="w-3 h-3 text-white" /> : 2}
              </Badge>
              Stablecoins
            </TabsTrigger>
            <TabsTrigger
              value={CURRENCY_TABS.ASSETS}
              className="data-[state=active]:bg-cherry data-[state=active]:shadow-none cursor-pointer p-0"
              onClick={() => onTabChange(CURRENCY_TABS.ASSETS)}
            >
              <Badge
                variant="vibrant"
                className={cn(
                  'mix-blend-multiply text-[9px]',
                  isInputFocused || isHovered ? 'bg-cream-white text-espresso font-bold' : 'bg-vibrant-white',
                  activeTab === CURRENCY_TABS.ASSETS ? 'bg-cherry-bright text-white' : '',
                )}
              >
                {activeTab === CURRENCY_TABS.ASSETS ? <XIcon className="w-3 h-3 text-white" /> : 2}
              </Badge>
              Assets
            </TabsTrigger>
            <TabsTrigger
              value={CURRENCY_TABS.TOP_APY}
              className="data-[state=active]:bg-cherry data-[state=active]:shadow-none cursor-pointer p-0"
              onClick={() => onTabChange(CURRENCY_TABS.TOP_APY)}
            >
              <Badge
                variant="vibrant"
                className={cn(
                  'mix-blend-multiply text-[9px]',
                  isInputFocused || isHovered ? 'bg-cream-white text-espresso font-bold' : 'bg-vibrant-white',
                  activeTab === CURRENCY_TABS.TOP_APY ? 'bg-cherry-bright' : '',
                )}
              >
                {activeTab === CURRENCY_TABS.TOP_APY ? <XIcon className="w-3 h-3 text-white" /> : 2}
              </Badge>
              Top APY
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent
          className="w-full md:!max-w-[480px] p-8 md:p-12 md:pb-8 gap-0 bg-vibrant-white block"
          hideCloseButton
        >
          <DialogTitle className="flex w-full justify-between p-0 text-espresso !text-(length:--body-super-comfortable) font-['InterRegular'] leading-[1.4] !font-medium">
            <span className="">Filter by network</span>
            <XIcon
              className="w-4 h-4 cursor-pointer text-clay-light hover:text-clay"
              onClick={() => setOpenDialog(false)}
            />
          </DialogTitle>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3">
            <div
              className={`group inline-flex justify-start items-center gap-4 py-2 cursor-pointer ${hoveredChain !== null && (hoveredChain === 'all' ? 'opacity-100' : 'opacity-60')}`}
              onClick={() => handleChainSelect('all')}
              onMouseEnter={() => setHoveredChain('all')}
              onMouseLeave={() => setHoveredChain(null)}
            >
              <div className="w-6 h-6  flex justify-center items-center gap-1 flex-wrap content-center overflow-hidden">
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
        </DialogContent>
      </Dialog>
    </>
  );
}

import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from '@/components/ui/input-group';
import { SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { availableChains as allAvailableChains } from '@/constants/chains';
import { ICON_MAINNET_CHAIN_ID, INJECTIVE_MAINNET_CHAIN_ID, LIGHTLINK_MAINNET_CHAIN_ID } from '@sodax/sdk';
import NetworkTransparentIcon from '@/components/shared/network-transparent-icon';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
interface CurrencySearchPanelProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedChain: string | null;
  setSelectedChain: (chainId: string | null) => void;
}

export default function CurrencySearchPanel({
  searchQuery,
  onSearchChange,
  selectedChain,
  setSelectedChain,
}: CurrencySearchPanelProps) {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const availableChains = allAvailableChains.filter(
    chain =>
      chain.id !== INJECTIVE_MAINNET_CHAIN_ID &&
      chain.id !== LIGHTLINK_MAINNET_CHAIN_ID &&
      chain.id !== ICON_MAINNET_CHAIN_ID,
  );
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const handleChainSelect = (chainId: string | null) => {
    setSelectedChain(chainId);
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
        </InputGroup>
        <div className="flex flex-wrap items-center">
          <div
            className={cn(
              "group text-clay text-(length:--body-small) font-medium font-['InterRegular'] leading-tight group-hover:font-bold py-1 px-3 cursor-pointer",
              hoveredChain !== null && (hoveredChain === 'all' ? 'opacity-100' : 'opacity-60'),
              selectedChain === null && 'ring-2 ring-cream-white rounded-full',
            )}
            onClick={() => handleChainSelect(null)}
            onMouseEnter={() => setHoveredChain('all')}
            onMouseLeave={() => setHoveredChain(null)}
          >
            All
          </div>
          {availableChains.map(chain => (
            <Tooltip key={chain.id}>
              <TooltipTrigger asChild>
                <div
                  key={chain.id}
                  className={cn(
                    'group cursor-pointer w-6 h-6 justify-center items-center flex',
                    hoveredChain !== null && (hoveredChain === chain.id ? 'opacity-100' : 'opacity-60'),
                    selectedChain === chain.id && 'ring-2 ring-clay-light rounded-full',
                  )}
                  onClick={() => handleChainSelect(chain.id)}
                  onMouseEnter={() => setHoveredChain(chain.id)}
                  onMouseLeave={() => setHoveredChain(null)}
                >
                  <NetworkTransparentIcon id={chain.id} />
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                sideOffset={20}
                className="bg-white px-8 py-4 items-center gap-2 text-espresso rounded-full h-[54px] text-(length:--body-comfortable)"
              >
                {chain.name}
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </motion.div>
    </>
  );
}

import { InputGroup, InputGroupAddon, InputGroupText, InputGroupInput } from '@/components/ui/input-group';
import { SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { availableChains as allAvailableChains, type ChainUI } from '@/constants/chains';
import { ICON_MAINNET_CHAIN_ID, INJECTIVE_MAINNET_CHAIN_ID, LIGHTLINK_MAINNET_CHAIN_ID } from '@sodax/sdk';
import NetworkTransparentIcon from '@/components/shared/network-transparent-icon';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { NetworkPicker } from './currency-search-panel/network-picker';
import { useClickAway } from 'react-use';
import { useSaveActions, useSaveState } from '../_stores/save-store-provider';
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
  const networkPickerReference = useRef<HTMLDivElement>(null);
  const [availableChains, setAvailableChains] = useState<ChainUI[]>(
    allAvailableChains.filter(
      chain =>
        chain.id !== INJECTIVE_MAINNET_CHAIN_ID &&
        chain.id !== LIGHTLINK_MAINNET_CHAIN_ID &&
        chain.id !== ICON_MAINNET_CHAIN_ID,
    ),
  );

  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const { setIsAssetListBlurred } = useSaveActions();
  const { isAssetListBlurred } = useSaveState();
  const MAX_DISPLAYED = 7;
  const displayedChains = availableChains.slice(0, MAX_DISPLAYED);
  const remainingChains = availableChains.slice(MAX_DISPLAYED);

  const handleChainSelect = (chainId: string | null, source: 'inline' | 'picker') => {
    setSelectedChain(chainId);
    setIsAssetListBlurred(false);
    if (source === 'picker' && chainId) {
      const selectedChain = availableChains.find(c => c.id === chainId);
      const rest = availableChains.filter(c => c.id !== chainId);

      if (selectedChain) {
        setAvailableChains([selectedChain, ...rest]);
      }
    }
  };

  useClickAway(networkPickerReference, () => setIsAssetListBlurred(false));

  return (
    <>
      <motion.div
        className="w-full gap-(--layout-space-small) flex flex-col md:flex-row"
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
        <div className="flex flex-wrap items-center sm:flex-1">
          <div
            className={cn(
              "group text-clay text-(length:--body-small) font-medium font-['InterRegular'] leading-tight group-hover:font-bold py-1 px-3 cursor-pointer leading-1.4",
              hoveredChain !== null && (hoveredChain === 'all' ? 'opacity-100' : 'opacity-60'),
              selectedChain === null && 'outline-2 outline-cream-white rounded-full',
            )}
            onClick={() => handleChainSelect(null, 'inline')}
            onMouseEnter={() => setHoveredChain('all')}
            onMouseLeave={() => setHoveredChain(null)}
          >
            All
          </div>
          {displayedChains.map(chain => (
            <Tooltip key={chain.id}>
              <TooltipTrigger asChild>
                <div
                  key={chain.id}
                  className={cn(
                    'group cursor-pointer w-6 h-6 justify-center items-center flex',
                    hoveredChain !== null && (hoveredChain === chain.id ? 'opacity-100' : 'opacity-60'),
                    selectedChain === chain.id && 'border-2 border-clay-light rounded-full',
                  )}
                  onClick={() => handleChainSelect(chain.id, 'inline')}
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
          <div
            className="ml-2 w-4 h-4 relative bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.5)] ring ring-2 ring-white inline-flex flex-col justify-center items-center cursor-pointer"
            ref={networkPickerReference}
            onClick={() => {
              setIsAssetListBlurred(true);
            }}
          >
            <div className="w-3 h-4 left-[4px] top-0 absolute mix-blend-multiply bg-white rounded shadow-[-2px_0px_2px_0px_rgba(175,145,145,0.5)] ring ring-2 ring-white" />
            <div className="left-[4.50px] top-[3px] absolute inline-flex justify-start items-center">
              <div className="justify-start text-espresso text-[8px] font-medium font-['InterRegular'] leading-[9.60px]">
                +{remainingChains.length}
              </div>
            </div>
            <NetworkPicker
              isClicked={isAssetListBlurred}
              chains={remainingChains}
              onSelect={chainId => handleChainSelect(chainId, 'picker')}
              reference={networkPickerReference.current}
            />
          </div>
        </div>
      </motion.div>
    </>
  );
}

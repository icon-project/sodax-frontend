import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  InputGroupInput,
  InputGroupButton,
} from '@/components/ui/input-group';
import { ChevronDownIcon, SearchIcon } from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { XIcon } from 'lucide-react';
import { useSaveState } from '../_stores/save-store-provider';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface CurrencySearchPanelProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export default function CurrencySearchPanel({ searchQuery, onSearchChange }: CurrencySearchPanelProps) {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('account');
  return (
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
          <InputGroupButton className="outline-none gap-1">
            <div className="w-6 h-6 grid grid-cols-2 gap-1 p-[2px]">
              <Image src="/chain/0x2105.base.png" alt="Base" width={8} height={8} className="rounded-[2px]" priority />
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
            <ChevronDownIcon
              className={cn(
                'w-4 h-4 text-clay-light',
                isInputFocused ? 'text-espresso' : isHovered ? 'text-clay' : 'text-clay-light',
              )}
            />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="hidden md:block ">
        <TabsList className="bg-transparent text-clay-light text-(length:--body-comfortable) p-0 gap-(--layout-space-small)">
          <TabsTrigger
            value="stablecoins"
            className="data-[state=active]:bg-cherry data-[state=active]:shadow-none cursor-pointer p-0"
          >
            <Badge
              variant="vibrant"
              className={cn(
                'mix-blend-multiply text-[9px]',
                isInputFocused || isHovered ? 'bg-cream-white text-espresso font-bold' : 'bg-vibrant-white',
                activeTab === 'stablecoins' ? 'bg-cherry-bright text-white' : '',
              )}
            >
              {activeTab === 'stablecoins' ? <XIcon className="w-3 h-3 text-espresso" /> : 2}
            </Badge>
            Stablecoins
          </TabsTrigger>
          <TabsTrigger
            value="assets"
            className="data-[state=active]:bg-cherry data-[state=active]:shadow-none cursor-pointer p-0"
          >
            <Badge
              variant="vibrant"
              className={cn(
                'mix-blend-multiply text-[9px]',
                isInputFocused || isHovered ? 'bg-cream-white text-espresso font-bold' : 'bg-vibrant-white',
                activeTab === 'assets' ? 'bg-cherry-bright text-white' : '',
              )}
            >
              {activeTab === 'assets' ? <XIcon className="w-3 h-3 text-espresso" /> : 2}
            </Badge>
            Assets
          </TabsTrigger>
          <TabsTrigger
            value="top-apy"
            className="data-[state=active]:bg-cherry data-[state=active]:shadow-none cursor-pointer p-0"
          >
            <Badge
              variant="vibrant"
              className={cn(
                'mix-blend-multiply text-[9px]',
                isInputFocused || isHovered ? 'bg-cream-white text-espresso font-bold' : 'bg-vibrant-white',
                activeTab === 'top-apy' ? 'bg-cherry-bright text-white' : '',
              )}
            >
              {activeTab === 'top-apy' ? <XIcon className="w-3 h-3 text-espresso" /> : 2}
            </Badge>
            Top APY
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </motion.div>
  );
}
